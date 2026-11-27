export const enquiryStatuses = ["new", "booked", "rejected"] as const;
export type EnquiryStatus = (typeof enquiryStatuses)[number];
export type DecisionStatus = Exclude<EnquiryStatus, "new">;
export type EnquiryFilter = EnquiryStatus | "all";

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
    notification: "pending" | "sending" | "failed" | "sent" | "expired";
  } | null;
};

export type EnquiryPage = {
  enquiries: DashboardEnquiry[];
  counts: Record<EnquiryFilter, number>;
  totalPages: number;
  page: number;
};
