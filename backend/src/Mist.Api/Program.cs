using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Mist.Api.Endpoints;
using Mist.Api.Hubs;
using Mist.Application.Abstractions;
using Mist.Application.Feedback;
using Mist.Application.Menu;
using Mist.Application.Orders;
using Mist.Application.Service;
using Mist.Application.Auth;
using Mist.Domain.Enums;
using Mist.Infrastructure.Auth;
using Mist.Infrastructure.Caching;
using Mist.Infrastructure.Persistence;
using Mist.Infrastructure.Persistence.Seed;
using Mist.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

/* ── Persistence ─────────────────────────────────────────────────────────
      No hardcoded fallback: a credential in source is one a deploy can pick
      up silently. Without a configured connection string the API should fail
      to start rather than quietly try default credentials against whatever
      Postgres happens to be reachable.
      Set ConnectionStrings__Postgres in the environment, or use
      appsettings.Development.json locally (see the .example alongside it). */
var postgres = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:Postgres is not configured. Set the "
        + "ConnectionStrings__Postgres environment variable, or copy "
        + "appsettings.Development.json.example to appsettings.Development.json.");
builder.Services.AddDbContext<MistDbContext>(o => o.UseNpgsql(postgres));

/* ── Caching: Redis when configured, in-memory otherwise, so the API runs
      with nothing else installed. ───────────────────────────────────────── */
var redis = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redis))
    builder.Services.AddStackExchangeRedisCache(o => o.Configuration = redis);
else
    builder.Services.AddDistributedMemoryCache();

/* ── Application ─────────────────────────────────────────────────────── */
builder.Services.AddCqrs<GetMenuQuery>();
builder.Services.AddScoped<IMenuCache, MenuCache>();
builder.Services.AddScoped<IMenuReader, MenuReader>();
builder.Services.AddScoped<Mist.Application.Analytics.IAnalyticsReader, AnalyticsReader>();
builder.Services.AddScoped<Mist.Application.MenuAdmin.IMenuWriter, MenuWriter>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IServiceCallRepository, ServiceCallRepository>();
builder.Services.AddScoped<IFeedbackRepository, FeedbackRepository>();
builder.Services.AddScoped<IRealtimeNotifier, SignalRNotifier>();
builder.Services.AddScoped<MenuSeeder>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IStaffDirectory, StaffDirectory>();
builder.Services.AddScoped<StaffSeeder>();

/* ── Authentication ──────────────────────────────────────────────────────
      The signing key is required, never defaulted: a key committed to source
      lets anyone who reads the repository mint a valid admin token. */
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.Section));
var jwt = builder.Configuration.GetSection(JwtOptions.Section).Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.SigningKey))
    throw new InvalidOperationException(
        "Jwt:SigningKey is not configured. Set the Jwt__SigningKey environment variable "
        + "to a random value of at least 32 bytes.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(30),
        };

        // A browser WebSocket cannot set an Authorization header, so SignalR
        // passes the token as a query parameter. Without this hook every staff
        // hub connection fails the moment JoinStaff is gated.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Admin implies staff; the KDS is usable by both.
    options.AddPolicy("staff", p => p.RequireRole(nameof(StaffRole.Staff), nameof(StaffRole.Admin)));
    options.AddPolicy("admin", p => p.RequireRole(nameof(StaffRole.Admin)));
});

builder.Services.AddSignalR();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<Mist.Api.DomainExceptionHandler>();

/* ── CORS: SignalR's negotiate sends credentials, and AllowAnyOrigin is
      illegal alongside AllowCredentials, so origins are enumerated. ─────── */
var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? ["http://localhost:3000", "http://localhost:3211"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
        }));
    o.AddPolicy("public-write", context => RateLimitPartition.GetFixedWindowLimiter(
        // Partition on table when present so one noisy table cannot mute the room.
        partitionKey: context.Request.Headers["X-Mist-Table"].FirstOrDefault()
            ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
        }));
});

var app = builder.Build();

if (app.Environment.IsDevelopment()) app.MapOpenApi();

app.UseExceptionHandler();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapPublicEndpoints();
app.MapAuthEndpoints();
app.MapAdminEndpoints();
app.MapHub<OrderHub>("/hubs/orders");
app.MapHub<ServiceCallHub>("/hubs/service");
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

/* `dotnet run -- seed` applies migrations and loads data/menu.source.json. */
if (args.Contains("seed"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<MistDbContext>();
    await db.Database.MigrateAsync();

    var sourcePath = Path.Combine(builder.Environment.ContentRootPath,
        "..", "..", "..", "data", "menu.source.json");
    await scope.ServiceProvider.GetRequiredService<MenuSeeder>()
        .SeedAsync(Path.GetFullPath(sourcePath));
    await scope.ServiceProvider.GetRequiredService<StaffSeeder>().SeedAsync();
    return;
}

app.Run();

/// <summary>Exposed so the test project can spin up the API in-process.</summary>
public partial class Program;
