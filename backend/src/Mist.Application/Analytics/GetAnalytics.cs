using Mist.Application.Abstractions;

namespace Mist.Application.Analytics;

public sealed record GetAnalyticsQuery(DateOnly From, DateOnly To) : IRequest<AnalyticsDto>;

public sealed class GetAnalyticsHandler(IAnalyticsReader reader)
    : IRequestHandler<GetAnalyticsQuery, AnalyticsDto>
{
    /// <summary>A year is the widest window worth serving from live tables.</summary>
    private const int MaxRangeDays = 366;

    public Task<AnalyticsDto> Handle(GetAnalyticsQuery request, CancellationToken ct)
    {
        if (request.To < request.From)
            throw new ArgumentException("`to` must not precede `from`.", nameof(request));

        if (request.To.DayNumber - request.From.DayNumber > MaxRangeDays)
            throw new ArgumentOutOfRangeException(
                nameof(request), $"Range may not exceed {MaxRangeDays} days.");

        return reader.ReadAsync(request.From, request.To, ct);
    }
}

public interface IAnalyticsReader
{
    Task<AnalyticsDto> ReadAsync(DateOnly from, DateOnly to, CancellationToken ct);
}
