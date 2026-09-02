"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminCancellationModal from "@/features/admin/appointments/components/AdminCancellationModal";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";

export default function AdminCancellationButton({ booking, label = "Cancel appointment", className = "btn-secondary w-full", initiallyOpen = false }: { booking: AdminAppointmentDetails; label?: string; className?: string; initiallyOpen?: boolean }) {
    const router = useRouter();
    const [open, setOpen] = useState(initiallyOpen);
    const close = () => {
        setOpen(false);
        if (initiallyOpen) {
            router.replace(`/admin/appointments/${booking.id}`);
        }
    };
    return <><button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>{open ? <AdminCancellationModal booking={booking} onClose={close} /> : null}</>;
}
