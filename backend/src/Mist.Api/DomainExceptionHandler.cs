using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Mist.Api;

/// <summary>
/// Maps domain failures to the right status code. Without this an invalid
/// rating or an unknown table slug surfaced as a 500, which tells a client
/// to retry a request that can never succeed.
/// </summary>
public sealed class DomainExceptionHandler(IProblemDetailsService problemDetails)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, title) = exception switch
        {
            ArgumentOutOfRangeException => (StatusCodes.Status400BadRequest, "Value out of range"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Invalid request"),
            // Unknown table or menu item: the client named something that does not exist.
            InvalidOperationException e when e.Message.StartsWith("Unknown", StringComparison.Ordinal)
                => (StatusCodes.Status404NotFound, "Not found"),
            _ => (0, string.Empty),
        };

        if (status == 0) return false;   // genuinely unexpected — let it 500 and be logged

        context.Response.StatusCode = status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = exception.Message,
            },
        });
    }
}
