using Mist.Application.Auth;

namespace Mist.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/v1/auth").WithTags("auth");

        auth.MapPost("/login", async (
                LoginInput input, IStaffDirectory directory, ITokenService tokens, CancellationToken ct) =>
            {
                var userId = await directory.AuthenticateAsync(input, ct);
                // One message for unknown email, wrong password and deactivated
                // account alike — distinguishing them enumerates staff accounts.
                return userId is null
                    ? Results.Problem(title: "Invalid credentials", statusCode: StatusCodes.Status401Unauthorized)
                    : Results.Ok(await tokens.IssueAsync(userId.Value, ct));
            })
           .WithName("Login")
           // Unauthenticated and guessable, so this is the one endpoint that
           // most needs a limiter.
           .RequireRateLimiting("auth");

        auth.MapPost("/refresh", async (
                RefreshInput input, ITokenService tokens, CancellationToken ct) =>
            {
                var issued = await tokens.RefreshAsync(input.RefreshToken, ct);
                return issued is null
                    ? Results.Problem(title: "Invalid refresh token", statusCode: StatusCodes.Status401Unauthorized)
                    : Results.Ok(issued);
            })
           .WithName("Refresh")
           .RequireRateLimiting("auth");

        auth.MapPost("/logout", async (
                RefreshInput input, ITokenService tokens, CancellationToken ct) =>
            {
                await tokens.RevokeAsync(input.RefreshToken, ct);
                return Results.NoContent();
            })
           .WithName("Logout")
           .RequireAuthorization("staff");
    }
}
