export interface SalesSummaryDto {
  orderCount: number;
  revenueMinor: number;
  averageTicketMinor: number;
  itemsSold: number;
  medianPrepMinutes: number | null;
  p90PrepMinutes: number | null;
}
export interface RevenuePointDto { day: string; revenueMinor: number; orderCount: number }
export interface PeakCellDto { dayOfWeek: number; hour: number; orderCount: number; revenueMinor: number }
export interface TopItemDto {
  slug: string; categorySlug: string; nameTr: string; nameEn: string;
  quantitySold: number; revenueMinor: number;
}
export interface AnalyticsDto {
  from: string; to: string;
  summary: SalesSummaryDto;
  revenue: RevenuePointDto[];
  peak: PeakCellDto[];
  topItems: TopItemDto[];
}
