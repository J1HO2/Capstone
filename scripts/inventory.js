// Inventory Module
import { supabase, departmentNames } from './config.js';

export let inventory = [];
export let stockTransactions = [];

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

    const result = await Swal.fire({
        title: 'Delete Product?',
        text: `Are you sure you want to delete "${item.name}" from inventory? This action cannot be undone.`,
        icon: 'warning',
        position: 'center',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        allowOutsideClick: false
    });

    if (!result.isConfirmed) return;

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
                text: "Could not remove this product from inventory.",
                confirmButtonColor: "#ef4444"
            });
            return;
        }

        Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "success",
            title: `"${item.name}" deleted successfully`,
            showConfirmButton: false,
            timer: 2000
        });

        await loadInventory();
    } catch (err) {
        console.error("⚠️ Unexpected delete error:", err);
        Swal.fire({
            icon: "error",
            title: "Unexpected Error",
            text: "Something went wrong while deleting.",
            confirmButtonColor: "#ef4444"
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

// Load stock transactions from database
export async function loadStockTransactions() {
    try {
        console.log('📂 Loading stock transactions from database...');
        const { data, error } = await supabase
            .from('stock_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('❌ Error loading transactions:', error);
            return;
        }

        if (!data || data.length === 0) {
            console.log('📭 No transactions found');
            stockTransactions = [];
            renderStockActivity();
            return;
        }

        // Transform transactions with inventory names
        stockTransactions = data.map(trans => {
            const product = inventory.find(inv => inv.id === trans.inventory_id);
            return {
                ...trans,
                product_name: product ? product.name : 'Unknown Product',
                icon: trans.transaction_type === 'stock_in' ? '📥' : '📤'
            };
        });

        console.log(`✅ Loaded ${stockTransactions.length} stock transactions`);
        console.log('📊 Transformed transactions:', stockTransactions);
        renderStockActivity();
    } catch (error) {
        console.error('❌ Failed to load stock transactions:', error);
    }
}

// Render stock activity tracker
export function renderStockActivity() {
    const activityList = document.getElementById('stockActivityList');
    if (!activityList) return;

    if (!stockTransactions || stockTransactions.length === 0) {
        activityList.innerHTML = '<div class="px-4 py-4 text-center text-gray-500 text-xs">No stock activity yet</div>';
        return;
    }

    const html = stockTransactions.map(transaction => {
        const date = new Date(transaction.created_at);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();
        
        const isStockIn = transaction.transaction_type === 'stock_in';
        const badgeColor = isStockIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const badgeText = isStockIn ? 'Added' : 'Removed';
        const quantitySign = isStockIn ? '+' : '-';

        return `
            <div class="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-3 flex-1">
                        <div class="text-xl leading-none pt-0.5">${transaction.icon}</div>
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-0.5">
                                <span class="font-semibold text-gray-900 text-sm">${transaction.product_name}</span>
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeColor}">
                                    ${badgeText}
                                </span>
                            </div>
                            <div class="text-xs text-gray-600 mb-0.5">
                                Qty: <span class="font-medium">${quantitySign}${transaction.quantity}</span>
                                <span class="mx-1 text-gray-300">•</span>
                                Stock: ${transaction.previous_stock} → ${transaction.new_stock}
                            </div>
                            <div class="text-[11px] text-gray-500">
                                ${transaction.user_name ? `By: ${transaction.user_name}` : 'System'}
                            </div>
                            ${transaction.reason ? `<div class="text-[11px] text-gray-600 mt-0.5 italic truncate">Reason: ${transaction.reason}</div>` : ''}
                            <div class="text-[10px] text-gray-400 mt-1">${formattedDate} at ${formattedTime}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    activityList.innerHTML = html;
}

// Clear stock transactions history
export async function clearStockTransactions() {
    const result = await Swal.fire({
        title: 'Clear Stock History?',
        text: 'This will permanently delete all stock transaction records. This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, clear it',
        cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
        const { error } = await supabase
            .from('stock_history')
            .delete()
            .neq('id', 0); // Delete all rows

        if (error) {
            Swal.fire('Error', 'Failed to clear history: ' + error.message, 'error');
            return;
        }

        stockTransactions = [];
        renderStockActivity();
        Swal.fire('Cleared!', 'Stock history has been cleared.', 'success');
    } catch (error) {
        Swal.fire('Error', 'An error occurred: ' + error.message, 'error');
    }
}

// Populate month filter for export
export function populateMonthFilter() {
    const filterSelect = document.getElementById('exportMonthFilter');
    if (!filterSelect) return;

    const months = new Set();
    const currentYear = new Date().getFullYear();

    stockTransactions.forEach(trans => {
        const date = new Date(trans.created_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        months.add(`${year}-${month}`);
    });

    const sortedMonths = Array.from(months).sort().reverse();
    
    filterSelect.innerHTML = '<option value="">All Months</option>';
    sortedMonths.forEach(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const option = document.createElement('option');
        option.value = month;
        option.textContent = monthName;
        filterSelect.appendChild(option);
    });
}

// Export stock history to CSV (inventory-style report)
export async function exportStockHistoryCSV() {
    const filterSelect = document.getElementById('exportMonthFilter');
    const selectedMonth = filterSelect ? filterSelect.value : '';

    let transactionsToExport = stockTransactions;

    if (selectedMonth) {
        transactionsToExport = stockTransactions.filter(trans => {
            const date = new Date(trans.created_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}` === selectedMonth;
        });
    }

    if (!inventory || inventory.length === 0) {
        Swal.fire('No Data', 'No inventory items loaded to export.', 'info');
        return;
    }

    // Helper to format numbers
    const fmt = (value) => (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Determine period labels
    let titleLine = 'INVENTORY REPORT';
    let subtitleLine = '';
    let beginningLabel = 'Beginning Inventory';
    let salesLabel = 'SALES';

    if (selectedMonth) {
        const [year, monthNum] = selectedMonth.split('-');
        const dateObj = new Date(year, monthNum - 1);
        const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
        titleLine = `INVENTORY OF MARKETING (Uniforms)`;
        subtitleLine = `For the month of ${monthName} ${year}`;
        beginningLabel = `Beginning Inventory - ${monthName} 1, ${year}`;
        const endOfMonth = new Date(year, monthNum, 0).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        salesLabel = `SALES (as of ${endOfMonth})`;
    }

    const lines = [];
    lines.push(titleLine);
    if (subtitleLine) lines.push(subtitleLine);
    lines.push('');

    // Header rows similar to the provided format
    lines.push([
        '',
        '',
        beginningLabel,
        '',
        '',
        'Ending Inventory',
        '',
        salesLabel,
        '',
        '',
        '',
        ''
    ].join(','));

    lines.push([
        'Item No.',
        'Particular',
        'Qty',
        'Unit Price',
        'Amount',
        'Qty',
        'Amount',
        'Qty',
        'Selling Price',
        'Amount',
        'COGS',
        'Net Income'
    ].join(','));

    let totalBeginningAmount = 0;
    let totalEndingAmount = 0;
    let totalSalesAmount = 0;
    let totalCOGS = 0;
    let totalNetIncome = 0;

    let itemNo = 1;

    inventory.forEach(item => {
        const unitPrice = parseFloat(item.price) || 0;

        // Transactions for this item in the period
        const itemTrans = transactionsToExport.filter(t => t.inventory_id === item.id);
        const totalIn = itemTrans
            .filter(t => t.transaction_type === 'stock_in')
            .reduce((sum, t) => sum + (t.quantity || 0), 0);
        const totalOut = itemTrans
            .filter(t => t.transaction_type === 'stock_out')
            .reduce((sum, t) => sum + (t.quantity || 0), 0);
        const netChange = totalIn - totalOut;

        const endingQty = parseFloat(item.stock) || 0;
        let beginningQty = endingQty - netChange;
        if (!Number.isFinite(beginningQty)) beginningQty = 0;

        const beginningAmount = beginningQty * unitPrice;
        const endingAmount = endingQty * unitPrice;

        const salesQty = totalOut;
        const sellingPrice = unitPrice; // adjust if you have a separate selling price
        const salesAmount = salesQty * sellingPrice;

        // For now, we treat COGS as 0 so Net Income equals sales amount.
        // If you have cost data, you can replace this logic.
        const cogs = 0;
        const netIncome = salesAmount - cogs;

        totalBeginningAmount += beginningAmount;
        totalEndingAmount += endingAmount;
        totalSalesAmount += salesAmount;
        totalCOGS += cogs;
        totalNetIncome += netIncome;

        lines.push([
            itemNo,
            `"${(item.name || '').replace(/"/g, '""')}"`,
            beginningQty || 0,
            fmt(unitPrice),
            fmt(beginningAmount),
            endingQty || 0,
            fmt(endingAmount),
            salesQty || 0,
            fmt(sellingPrice),
            fmt(salesAmount),
            fmt(cogs),
            fmt(netIncome)
        ].join(','));

        itemNo += 1;
    });

    // Totals row
    lines.push('');
    lines.push([
        '',
        'TOTAL',
        '',
        '',
        fmt(totalBeginningAmount),
        '',
        fmt(totalEndingAmount),
        '',
        '',
        fmt(totalSalesAmount),
        fmt(totalCOGS),
        fmt(totalNetIncome)
    ].join(','));

    const csvContent = lines.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `inventory-report-${selectedMonth || 'all-time'}-${new Date().getTime()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire('Success', 'Inventory report exported in marketing format.', 'success');
}
