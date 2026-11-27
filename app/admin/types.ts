export const enquiryStatuses = ["new", "booked", "rejected"] as const;
export type EnquiryStatus = (typeof enquiryStatuses)[number];
export type DecisionStatus = Exclude<EnquiryStatus, "new">;
export type EnquiryFilter = EnquiryStatus | "all";
type NotificationStatus = "pending" | "sending" | "failed" | "sent" | "expired";

export type DashboardEnquiry = {
  id: number;
  createdAt: string;
  eventDate: string;
  startTime: string;
  eventType: string;
  packageName: string | null;
  venue: string;
  guestCount: number;
  fulfilment: string | null;
  games: string[];
  name: string;
  email: string;
  phone: string;
  notes: string | null;
  status: EnquiryStatus;
  decision: {
    decidedAt: string;
    decidedBy: string;
    customerNote: string;
    notification: NotificationStatus;
  } | null;
  reminder: { notification: NotificationStatus; sentAt: string | null; eventDate: string; to: string } | null;
};

export type EnquiryPage = {
  enquiries: DashboardEnquiry[];
  counts: Record<EnquiryFilter, number>;
  totalPages: number;
  page: number;
};
