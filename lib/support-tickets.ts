export const SUPPORT_TICKET_CATEGORIES = [
  { value: 'DELIVERY', label: 'Delivery / shipping' },
  { value: 'ITEM_ISSUE', label: 'Wrong or damaged item' },
  { value: 'REFUND', label: 'Refund or return' },
  { value: 'ORDER_STATUS', label: 'Order status' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type SupportTicketCategoryValue =
  (typeof SUPPORT_TICKET_CATEGORIES)[number]['value'];

export const SUPPORT_TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export type SupportTicketStatusValue = (typeof SUPPORT_TICKET_STATUSES)[number];

const CATEGORY_LABEL: Record<SupportTicketCategoryValue, string> = {
  DELIVERY: 'Delivery / shipping',
  ITEM_ISSUE: 'Wrong or damaged item',
  REFUND: 'Refund or return',
  ORDER_STATUS: 'Order status',
  OTHER: 'Other',
};

const STATUS_LABEL: Record<SupportTicketStatusValue, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export function supportTicketCategoryLabel(category: string): string {
  return CATEGORY_LABEL[category as SupportTicketCategoryValue] ?? category;
}

export function supportTicketStatusLabel(status: string): string {
  return STATUS_LABEL[status as SupportTicketStatusValue] ?? status;
}

export function shortOrderId(orderId: string): string {
  if (orderId.length <= 10) return orderId;
  return `${orderId.slice(0, 8)}…`;
}
