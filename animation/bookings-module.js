import { supabase } from './supabase-client.js';

let bookings = [];

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
    renderBookings();
}

export function renderBookings(data = bookings) {
    const tbody = document.getElementById("bookingsTable");
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                    No active leases found.
                </td>
            </tr>
        `;
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
            <td class="px-6 py-4 font-medium text-${b.status === 'Active' ? 'green' : 'gray'}-600">${b.status}</td>
            <td class="px-6 py-4 text-center space-x-2">
                <button onclick="bookingsModule.cancelLease(${b.id})" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">End</button>
                <button onclick="bookingsModule.deleteLease(${b.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Delete</button>
            </td>
        </tr>
    `).join("");
}

export async function cancelLease(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const confirm = await Swal.fire({
        title: "End Lease?",
        text: `Are you sure you want to end the lease for ${booking.tenant}?`,
        icon: "warning",
        position: "center",
        showCancelButton: true,
        confirmButtonColor: "#eab308",
        confirmButtonText: "Yes, end it",
        allowOutsideClick: false
    });

    if (!confirm.isConfirmed) return;

    const { error } = await supabase
        .from("bookings")
        .update({ status: "Ended" })
        .eq("id", bookingId);

    if (error) {
        Swal.fire("Error", "Failed to update booking status.", "error");
        return;
    }

    await supabase.from("rooms").update({ status: "Available" }).eq("id", booking.room_id);

    await loadBookings();
    
    Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: "Lease ended successfully!",
        showConfirmButton: false,
        timer: 1500
    });
}

export async function deleteLease(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const confirm = await Swal.fire({
        title: "Delete Lease?",
        text: `This will permanently remove the lease for ${booking.tenant}.`,
        icon: "warning",
        position: "center",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete it",
        allowOutsideClick: false
    });

    if (!confirm.isConfirmed) return;

    const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
    
    if (error) {
        Swal.fire("Error", "Could not delete booking.", "error");
        return;
    }

    bookings = bookings.filter(b => b.id !== bookingId);
    renderBookings();

    Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: "Lease deleted successfully!",
        showConfirmButton: false,
        timer: 1500
    });
}

export function getBookingsData() {
    return bookings;
}
