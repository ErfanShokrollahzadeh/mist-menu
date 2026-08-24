using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Mist.Api.Endpoints;
using Mist.Api.Hubs;
using Mist.Application.Abstractions;
using Mist.Application.Feedback;
using Mist.Application.Menu;
using Mist.Application.Orders;
using Mist.Application.Service;
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
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IServiceCallRepository, ServiceCallRepository>();
builder.Services.AddScoped<IFeedbackRepository, FeedbackRepository>();
builder.Services.AddScoped<IRealtimeNotifier, SignalRNotifier>();
builder.Services.AddScoped<MenuSeeder>();

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

app.MapPublicEndpoints();
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
    return;
}

app.Run();

/// <summary>Exposed so the test project can spin up the API in-process.</summary>
public partial class Program;
