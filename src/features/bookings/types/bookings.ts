import type { Enums } from "@/types/supabase";

export type BookingStatus = Enums<"booking_status">;
export type DepositStatus = Enums<"deposit_status">;
export type CancellationRequestStatus = Enums<"cancellation_request_status">;
export type RefundMethod = Enums<"refund_method">;

export type BookingStatusFilter = "all" | Exclude<BookingStatus, "held">;

export type BookingSummary = {
    courtesyApplied?: boolean;
    id: string;
    bookingReference: string;
    status: BookingStatus;
    depositStatus: DepositStatus;
    startsAt: string | null;
    endsAt: string | null;
    estimatedTotal: number;
    finalTotal: number;
    subtotalAmount: number;
    bookingFeeAmount: number;
    amountPaid: number;
    amountDue: number;
    createdAt: string;
    lineItems: {
        id: string;
        itemType: string;
        label: string;
        description: string | null;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        sourceId?: string | null;
        sourceTable?: string | null;
    }[];
    cancellationRequest?: {
        id: string;
        status: CancellationRequestStatus;
        reason: string;
        createdAt: string;
    } | null;
};

export type MyBookingsPageData = {
    upcomingBookings: BookingSummary[];
    pastBookings: BookingSummary[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    filters: {
        search: string;
        status: BookingStatusFilter;
    };
};

export type BookingCancellationActionState = {
    error?: string;
    success?: string;
    messageId?: string;
};

export type BookingEditActionState = {
    error?: string;
    success?: string;
    messageId?: string;
};
