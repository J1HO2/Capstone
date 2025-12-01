// Inventory Module
import { supabase, departmentNames } from './config.js';

export let inventory = [];

// Record stock transaction to history
export async function recordStockTransaction(inventoryId, transactionType, quantity, reason, previousStock, newStock) {
    try {
        // Get current user info from Supabase auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            console.warn('Could not get user info for transaction log');
        }

        const { error } = await supabase
            .from('stock_history')
            .insert([{
                inventory_id: inventoryId,
                transaction_type: transactionType,
                quantity: quantity,
                reason: reason || 'No reason provided',
                user_email: user?.email || 'unknown',
                user_name: user?.user_metadata?.full_name || user?.email || 'unknown',
                previous_stock: previousStock,
                new_stock: newStock,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('❌ Failed to record stock transaction:', error.message);
            return false;
        }

        console.log(`✅ Transaction recorded: ${transactionType} - ${quantity} units`);
        return true;
    } catch (err) {
        console.error('⚠️ Unexpected error recording transaction:', err);
        return false;
    }
}

// Load inventory from Supabase
export async function loadInventory() {
    const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("❌ Failed to load inventory:", error.message);
        alert("Error loading inventory — check console.");
        return;
    }

    inventory = data || [];
    console.log(`✅ Loaded ${inventory.length} items from Supabase.`);
    renderInventory();
}

// Render inventory table
export function renderInventory(data = inventory) {
    const tableBody = document.getElementById('inventoryTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (data.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="8" class="px-6 py-12 text-center">
                <div class="text-gray-500">
                    <p class="text-lg font-medium mb-2">No products in inventory</p>
                    <p class="text-sm">Click "Add New Product" to get started</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const statusColor = item.status === 'In Stock' ? 'text-green-600 bg-green-100' : 
                           item.status === 'Low Stock' ? 'text-yellow-600 bg-yellow-100' : 
                           'text-red-600 bg-red-100';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${item.category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${departmentNames[item.department] || item.department}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.stock}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱${item.price.toLocaleString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                    ${item.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                    <button onclick="window.openStockModal(${item.id}, 'in')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 shadow-sm hover:shadow-md">
                        Stock In
                    </button>
                    <button onclick="window.openStockModal(${item.id}, 'out')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 shadow-sm hover:shadow-md">
                        Stock Out
                    </button>
                    <button onclick="window.deleteInventoryItem(${item.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 shadow-sm hover:shadow-md">
                        Delete
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Delete inventory item
export async function deleteInventoryItem(id) {
    const item = inventory.find(p => p.id === id);
    if (!item) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${item.name}" from the inventory?`);
    if (!confirmDelete) return;

    try {
        const { error } = await supabase
            .from("inventory")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("❌ Supabase delete failed:", error.message);
            Swal.fire({
                icon: "error",
                title: "Delete Failed",
                text: "Could not remove this product from Supabase.",
                confirmButtonColor: "#eab308"
            });
            return;
        }

        Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "success",
            title: `"${item.name}" deleted successfully`,
            showConfirmButton: false,
            timer: 1500,
            background: "#fff",
            color: "#000",
            width: "18rem",
            customClass: {
                popup: "rounded-lg shadow border border-gray-200 text-sm"
            }
        });

        await loadInventory();
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

// Filter inventory
export function filterInventory() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const departmentFilter = document.getElementById('departmentFilter');

    if (!searchInput || !categoryFilter || !departmentFilter) return;

    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const department = departmentFilter.value;

    const filtered = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || item.category === category;
        const matchesDepartment = !department || item.department === department;
        return matchesSearch && matchesCategory && matchesDepartment;
    });

    renderInventory(filtered);
}
