export const PRODUCT_REPORT_REASONS = [
  'Incorrect information',
  'Counterfeit or prohibited item',
  'Offensive content',
  'Pricing issue',
  'Other',
] as const;

export type ProductReportReason = (typeof PRODUCT_REPORT_REASONS)[number];
