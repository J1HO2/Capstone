// Rooms Module
import { supabase } from './config.js';

export let rooms = [];

// Load rooms from Supabase
export async function loadRooms() {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("❌ Error loading rooms:", error.message);
        return;
    }

    rooms = data || [];
    console.log(`✅ Loaded ${rooms.length} rooms from Supabase.`);
    renderRooms(rooms);
    updateRoomDropdown();
}

// Render rooms table
export function renderRooms(data = rooms) {
    const tableBody = document.getElementById('roomsTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                <p class="text-lg font-medium mb-2">No rooms available</p>
                <p class="text-sm">Click "Add New Room" to add one.</p>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    data.forEach(room => {
        // Determine status display and color
        let statusDisplay = room.status;
        let statusColor = 'bg-gray-100 text-gray-600';
        
        if (room.status === 'Available') {
            statusColor = 'bg-green-100 text-green-600';
        } else if (room.status === 'Occupied' || room.status === 'Full') {
            statusDisplay = 'Occupied';
            statusColor = 'bg-red-100 text-red-600';
        }

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';

        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-900">${room.name}</td>
            <td class="px-6 py-4 text-sm text-gray-500 capitalize">${room.type}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${room.capacity}</td>
            <td class="px-6 py-4 text-sm text-gray-900">₱${room.rate.toLocaleString()}</td>
            <td class="px-6 py-4 text-sm">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                    ${statusDisplay}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <button 
                    onclick="window.deleteRoom(${room.id})" 
                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-150 shadow-sm hover:shadow-md inline-flex items-center space-x-1"
                    ${room.status === 'Occupied' ? 'disabled title="Cannot delete occupied room"' : ''}>
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Delete</span>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Delete room
export async function deleteRoom(id) {
    const room = rooms.find(r => r.id === id);
    if (!room) return;

    // Prevent deletion of occupied rooms
    if (room.status === 'Occupied' || room.status === 'Full') {
        Swal.fire({
            icon: "error",
            title: "Cannot Delete",
            text: "This room is currently occupied. Please end the lease first before deleting the room.",
            confirmButtonColor: "#eab308"
        });
        return;
    }

    const result = await Swal.fire({
        title: `Delete "${room.name}"?`,
        text: "This will permanently remove the room from the database.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#eab308",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        background: "#fff",
        color: "#000"
    });

    if (!result.isConfirmed) return;

    try {
        const { error } = await supabase
            .from("rooms")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("❌ Supabase delete failed:", error.message);
            Swal.fire({
                icon: "error",
                title: "Delete Failed",
                text: "Could not delete this room from Supabase.",
                confirmButtonColor: "#eab308"
            });
            return;
        }

        rooms = rooms.filter(r => r.id !== id);
        renderRooms();
        await loadRooms(); // Reload from database to ensure consistency

        Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "success",
            title: `"${room.name}" deleted successfully`,
            showConfirmButton: false,
            timer: 1500,
            background: "#fff",
            color: "#000",
            width: "18rem",
            customClass: {
                popup: "rounded-lg shadow border border-gray-200 text-sm"
            }
        });
    } catch (err) {
        console.error("⚠️ Unexpected delete error:", err);
        Swal.fire({
            icon: "error",
            title: "Unexpected Error",
            text: "Something went wrong while deleting.",
            confirmButtonColor: "#eab308"
        });
    }
}

// Update room dropdown for bookings
export function updateRoomDropdown() {
    const select = document.getElementById('bookingRoom');
    if (!select) return;

    select.innerHTML = '<option value="">Select a room</option>';
    
    const availableRooms = rooms.filter(r => r.status === 'Available');
    
    if (availableRooms.length === 0) {
        select.innerHTML = '<option value="">No available rooms</option>';
        return;
    }
    
    availableRooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.name} - ${room.type} (₱${room.rate.toLocaleString()})`;
        select.appendChild(option);
    });
}

// Filter rooms based on search and type
export function filterRooms() {
    const searchInput = document.getElementById('roomSearchInput');
    const typeFilter = document.getElementById('roomTypeFilter');
    
    let filtered = [...rooms];
    
    // Apply search filter
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filtered = filtered.filter(room => 
            room.name.toLowerCase().includes(searchTerm) ||
            room.type.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply type filter
    if (typeFilter && typeFilter.value) {
        filtered = filtered.filter(room => room.type === typeFilter.value);
    }
    
    renderRooms(filtered);
}
