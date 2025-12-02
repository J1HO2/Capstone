// Bookings Module
import { supabase } from './config.js';
import { rooms } from './rooms.js';

export let bookings = [];

// Load bookings from Supabase
export async function loadBookings() {
    const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("❌ Error loading bookings:", error.message);
        return;
    }

    bookings = data || [];
    console.log(`✅ Loaded ${bookings.length} bookings from Supabase.`);
    renderBookings(bookings);
}

// Render bookings table
export function renderBookings(data = bookings) {
    const tbody = document.getElementById("bookingsTable");
    if (!tbody) {
        console.error("❌ Could not find bookingsTable element.");
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    No active leases found.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = data.map(b => `
        <tr data-booking-id="${b.id}" class="hover:bg-gray-50">
            <td class="px-6 py-4">#${b.id}</td>
            <td class="px-6 py-4">${b.room_name || "N/A"}</td>
            <td class="px-6 py-4">${b.tenant || "—"}</td>
            <td class="px-6 py-4">${b.contact || "—"}</td>
            <td class="px-6 py-4">${b.start_date || "—"}</td>
            <td class="px-6 py-4">${b.end_date || "—"}</td>
            <td class="px-6 py-4">₱${(b.rent || 0).toLocaleString()}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${b.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${b.status}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="window.cancelLease(${b.id})" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-150 shadow-sm hover:shadow-md">
                        End
                    </button>
                    <button onclick="window.deleteLease(${b.id})" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-150 shadow-sm hover:shadow-md">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// Cancel/End lease
export async function cancelLease(bookingId) {
    try {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) {
            Swal.fire("Error", "Booking not found.", "error");
            return;
        }

        const confirm = await Swal.fire({
            title: "End Lease?",
            text: `Are you sure you want to end the lease for ${booking.tenant_name || booking.tenant}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#eab308",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, end it"
        });

        if (!confirm.isConfirmed) return;

        const { error: bookingError } = await supabase
            .from("bookings")
            .update({ status: "Ended" })
            .eq("id", bookingId);

        if (bookingError) {
            Swal.fire("Error", "Failed to update booking status.", "error");
            console.error(bookingError);
            return;
        }

        const { error: roomError } = await supabase
            .from("rooms")
            .update({ status: "Available" })
            .eq("id", booking.room_id);

        if (roomError) console.error("Room update failed:", roomError);

        booking.status = "Ended";
        const room = rooms.find(r => r.id === booking.room_id);
        if (room) room.status = "Available";

        renderBookings(bookings);

        Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "success",
            title: "Lease ended successfully!",
            showConfirmButton: false,
            timer: 1500,
            background: "#fff",
            color: "#000"
        });
    } catch (err) {
        console.error("Unexpected cancelLease error:", err);
        Swal.fire("Error", "Unexpected issue while ending lease.", "error");
    }
}

// Delete lease
export async function deleteLease(bookingId) {
    try {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) {
            Swal.fire("Error", "Booking not found.", "error");
            return;
        }

        const confirm = await Swal.fire({
            title: "Delete Lease?",
            text: `This will permanently remove the lease for ${booking.tenant || "this tenant"}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it"
        });

        if (!confirm.isConfirmed) return;

        const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
        if (error) {
            console.error("Delete failed:", error);
            Swal.fire("Error", "Could not delete booking from database.", "error");
            return;
        }

        bookings = bookings.filter(b => b.id !== bookingId);
        renderBookings(bookings);
        await loadBookings(); // Reload from database to ensure consistency

        Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "success",
            title: "Lease deleted successfully!",
            showConfirmButton: false,
            timer: 1500,
            background: "#fff",
            color: "#000"
        });
    } catch (err) {
        console.error("Unexpected deleteLease error:", err);
        Swal.fire("Error", "Unexpected issue while deleting lease.", "error");
    }
}
