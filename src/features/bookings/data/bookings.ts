import { createClient } from "@/lib/supabase/server";
import type {
    BookingSummary,
    MyBookingsPageData,
    BookingStatusFilter,
} from "@/features/bookings/types/bookings";
import {
    pastBookingStatuses,
    getBookingStatusLabel,
    getDepositStatusLabel,
    isPastBooking,
    isUpcomingBooking,
} from "@/features/bookings/utils/booking-status";
import { formatBookingDate } from "@/features/bookings/utils/booking-formatters";
import type { Database } from "@/types/supabase";
import { calculateBookingLedger, hasLoyaltyCourtesy } from "@/features/bookings/utils/booking-ledger";

type BookingBaseRow = Pick<
    Database["public"]["Tables"]["bookings"]["Row"],
    | "id"
    | "booking_reference"
    | "status"
    | "deposit_status"
    | "estimated_total"
    | "final_total"
    | "subtotal_amount"
    | "booking_fee_amount"
    | "amount_paid"
    | "amount_due"
    | "created_at"
>;

type BookingRow = BookingBaseRow & {
    booking_events?: Pick<Database["public"]["Tables"]["booking_events"]["Row"], "event_type" | "actor_type" | "metadata">[] | null;
    availability_slots?: Pick<
        Database["public"]["Tables"]["availability_slots"]["Row"],
        "starts_at" | "ends_at"
    > | null;
    booking_line_items?: Array<
        Pick<
            Database["public"]["Tables"]["booking_line_items"]["Row"],
            | "id"
            | "item_type"
            | "label_snapshot"
            | "description_snapshot"
            | "quantity"
            | "unit_price"
            | "line_total"
            | "active"
            | "removed_at"
            | "created_at"
        >
    > | null;
    booking_payments?: Array<
        Pick<
            Database["public"]["Tables"]["booking_payments"]["Row"],
            "payment_type" | "status" | "amount"
        >
    > | null;
    cancellation_requests?: Array<
        Pick<
            Database["public"]["Tables"]["cancellation_requests"]["Row"],
            "id" | "status" | "reason" | "created_at"
        >
    > | null;
};

type GetMyBookingsPageDataInput = {
    userId: string;
    search?: string;
    status?: BookingStatusFilter;
    page?: number;
    pageSize?: number;
};

const selectSummary = `
    id,
    booking_reference,
    status,
    deposit_status,
    estimated_total,
    final_total,
    subtotal_amount,
    booking_fee_amount,
    amount_paid,
    amount_due,
    created_at,
    availability_slots:slot_id (
        starts_at,
        ends_at
    ),
    booking_line_items (
        id,
        item_type,
        label_snapshot,
        description_snapshot,
        quantity,
        unit_price,
        line_total,
        active,
        removed_at,
        created_at
    ),
    booking_events (event_type, actor_type, metadata),
    booking_payments (
        payment_type,
        status,
        amount
    ),
    cancellation_requests (
        id,
        status,
        reason,
        created_at
    )
`;

function sanitizedError() {
    return new Error("We couldn't load your bookings right now.");
}

function normalizePage(value: number | undefined) {
    return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 1;
}

function normalizePageSize(value: number | undefined) {
    return Number.isFinite(value) && value && value > 0
        ? Math.min(Math.floor(value), 24)
        : 6;
}

function compareUpcoming(a: BookingRow, b: BookingRow) {
    const aStart = a.availability_slots?.starts_at;
    const bStart = b.availability_slots?.starts_at;

    if (aStart && bStart) {
        const diff = new Date(aStart).getTime() - new Date(bStart).getTime();
        if (diff !== 0) return diff;
    }

    if (aStart && !bStart) return -1;
    if (!aStart && bStart) return 1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function comparePast(a: BookingRow, b: BookingRow) {
    const aDate = a.availability_slots?.starts_at ?? a.created_at;
    const bDate = b.availability_slots?.starts_at ?? b.created_at;

    return new Date(bDate).getTime() - new Date(aDate).getTime();
}

function getBookingSearchText(row: BookingRow) {
    const dateText = row.availability_slots?.starts_at
        ? formatBookingDate(row.availability_slots.starts_at)
        : formatBookingDate(row.created_at);

    const lineItemLabels = (row.booking_line_items ?? [])
        .filter((item) => item.active && !item.removed_at)
        .map((item) => item.label_snapshot)
        .filter((label): label is string => Boolean(label));

    return [
        row.booking_reference,
        getBookingStatusLabel(row.status),
        getDepositStatusLabel(row.deposit_status),
        dateText,
        ...lineItemLabels,
    ]
        .join(" ")
        .toLowerCase();
}

function mapBookingSummary(row: BookingRow) {
    const lineItems = (row.booking_line_items ?? [])
        .filter((item) => item.active && !item.removed_at)
        .sort(
            (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
        )
        .map((item) => ({
            id: item.id,
            itemType: item.item_type,
            label: item.label_snapshot,
            description: item.description_snapshot,
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unit_price || 0),
            lineTotal:
                Number(item.line_total) ||
                Number(item.unit_price || 0) * Number(item.quantity || 0),
        }));

    const calculatedSubtotal = lineItems.reduce(
        (total, item) => total + item.lineTotal,
        0,
    );

    const estimatedTotal =
        Number(row.estimated_total || 0) > 0
            ? Number(row.estimated_total)
            : calculatedSubtotal;

    const finalTotal = Number(row.final_total || 0);
    const courtesyApplied = row.status === "completed" && hasLoyaltyCourtesy(row.booking_events ?? []);
    const ledger = calculateBookingLedger({
        courtesyApplied,
        appointmentTotal: finalTotal > 0 ? finalTotal : estimatedTotal,
        payments: (row.booking_payments ?? []).map((payment) => ({
            type: payment.payment_type,
            status: payment.status,
            amount: Number(payment.amount),
        })),
    });
    const latestCancellationRequest =
        row.cancellation_requests
            ?.slice()
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
            )[0] ?? null;

    return {
        id: row.id,
        bookingReference: row.booking_reference,
        courtesyApplied,
        status: row.status,
        depositStatus: row.deposit_status,
        startsAt: row.availability_slots?.starts_at ?? null,
        endsAt: row.availability_slots?.ends_at ?? null,
        estimatedTotal,
        finalTotal,
        subtotalAmount: Number(row.subtotal_amount || 0),
        bookingFeeAmount: Number(row.booking_fee_amount || 0),
        amountPaid: ledger.totalApplied,
        amountDue: ledger.amountDue,
        createdAt: row.created_at,
        lineItems,
        cancellationRequest: latestCancellationRequest
            ? {
                  id: latestCancellationRequest.id,
                  status: latestCancellationRequest.status,
                  reason: latestCancellationRequest.reason,
                  createdAt: latestCancellationRequest.created_at,
              }
            : null,
    };
}

export async function getDashboardUpcomingBookings(
    userId: string,
    limit = 3,
): Promise<BookingSummary[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("bookings")
        .select(selectSummary)
        .eq("user_id", userId)
        .in("status", ["requested", "confirmed", "cancellation_requested"])
        .order("created_at", { ascending: false })
        .overrideTypes<BookingRow[]>();

    if (error) {
        console.error("[bookings:getDashboardUpcomingBookings]", error);
        throw sanitizedError();
    }

    return (data ?? [])
        .filter((booking) => {
            const startsAt = booking.availability_slots?.starts_at;

            return !startsAt || new Date(startsAt).getTime() >= Date.now();
        })
        .sort(compareUpcoming)
        .slice(0, limit)
        .map(mapBookingSummary);
}

export async function getMyBookingsPageData({
    userId,
    search = "",
    status = "all",
    page,
    pageSize,
}: GetMyBookingsPageDataInput): Promise<MyBookingsPageData> {
    const supabase = await createClient();
    const safePage = normalizePage(page);
    const safePageSize = normalizePageSize(pageSize);
    const normalizedSearch = search.trim().slice(0, 80);
    const normalizedSearchText = normalizedSearch.toLowerCase();

    const { data, error } = await supabase
        .from("bookings")
        .select(selectSummary)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .overrideTypes<BookingRow[]>();

    if (error) {
        console.error("[bookings:getMyBookingsPageData.bookings]", error);
        throw sanitizedError();
    }

    const rows = data ?? [];

    const upcomingBookings = rows
        .filter((booking) =>
            isUpcomingBooking(
                booking.status,
                booking.availability_slots?.starts_at,
            ),
        )
        .sort(compareUpcoming)
        .slice(0, 5)
        .map(mapBookingSummary);

    const pastRows = rows
        .filter((booking) =>
            isPastBooking(
                booking.status,
                booking.availability_slots?.starts_at,
            ),
        )
        .filter(
            (booking) =>
                pastBookingStatuses.includes(booking.status) ||
                Boolean(booking.availability_slots?.starts_at),
        )
        .filter((booking) => {
            if (status !== "all" && booking.status !== status) {
                return false;
            }

            if (!normalizedSearchText) {
                return true;
            }

            return getBookingSearchText(booking).includes(normalizedSearchText);
        })
        .sort(comparePast);

    const total = pastRows.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const currentPage = Math.min(safePage, totalPages);

    return {
        upcomingBookings,
        pastBookings: pastRows.map(mapBookingSummary),
        pagination: {
            page: currentPage,
            pageSize: safePageSize,
            total,
            totalPages,
        },
        filters: {
            search: normalizedSearch,
            status,
        },
    };
}
