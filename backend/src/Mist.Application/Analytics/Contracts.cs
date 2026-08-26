namespace Mist.Application.Analytics;

/// <summary>Headline figures. These are stat tiles, not charts.</summary>
public sealed record SalesSummaryDto(
    int OrderCount,
    long RevenueMinor,
    long AverageTicketMinor,
    int ItemsSold,
    double? MedianPrepMinutes,
    double? P90PrepMinutes);

public sealed record RevenuePointDto(DateOnly Day, long RevenueMinor, int OrderCount);

/// <summary>One cell of the day-of-week × hour grid.</summary>
public sealed record PeakCellDto(int DayOfWeek, int Hour, int OrderCount, long RevenueMinor);

public sealed record TopItemDto(
    string Slug, string CategorySlug, string NameTr, string NameEn,
    int QuantitySold, long RevenueMinor);

public sealed record AnalyticsDto(
    DateOnly From,
    DateOnly To,
    SalesSummaryDto Summary,
    IReadOnlyList<RevenuePointDto> Revenue,
    IReadOnlyList<PeakCellDto> Peak,
    IReadOnlyList<TopItemDto> TopItems);
