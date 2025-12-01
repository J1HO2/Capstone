// Stock History Module
import { supabase, departmentNames } from './config.js';

export let stockHistory = [];
let fullStockHistoryData = [];

// Load stock history from Supabase (for dashboard)
export async function loadStockHistory() {
    try {
        const { data, error } = await supabase
            .from('stock_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('❌ Failed to load stock history:', error.message);
            return;
        }

        stockHistory = data || [];
        console.log(`✅ Loaded ${stockHistory.length} stock history records from Supabase.`);
        renderStockHistory();
    } catch (err) {
        console.error('⚠️ Unexpected error loading stock history:', err);
    }
}

// Load detailed stock history (with inventory product info)
export async function loadDetailedStockHistory() {
    try {
        const { data: historyData, error: historyError } = await supabase
            .from('stock_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (historyError) {
            console.error('❌ Failed to load stock history:', historyError.message);
            return;
        }

        // Get inventory items to map with history
        const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('id, name');

        if (inventoryError) {
            console.error('❌ Failed to load inventory:', inventoryError.message);
            return;
        }

        // Create inventory map for quick lookup
        const inventoryMap = {};
        inventoryData.forEach(item => {
            inventoryMap[item.id] = item.name;
        });

        // Combine data
        fullStockHistoryData = historyData.map(record => ({
            ...record,
            product_name: inventoryMap[record.inventory_id] || 'Unknown Product'
        }));

        console.log(`✅ Loaded ${fullStockHistoryData.length} detailed stock history records.`);
        renderDetailedStockHistory(fullStockHistoryData);
        updateHistoryStatistics(fullStockHistoryData);
    } catch (err) {
        console.error('⚠️ Unexpected error loading detailed stock history:', err);
    }
}

// Render stock history for dashboard
export function renderStockHistory(data = stockHistory) {
    const historyList = document.getElementById('stockHistoryList');
    if (!historyList) return;

    historyList.innerHTML = '';

    if (data.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-center py-8 text-gray-500';
        emptyDiv.innerHTML = `
            <svg class="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"></path>
            </svg>
            <p>No stock history yet</p>
        `;
        historyList.appendChild(emptyDiv);
        return;
    }

    data.forEach(record => {
        const date = new Date(record.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const transactionType = record.transaction_type;
        const isStockIn = transactionType === 'stock_in';
        const typeColor = isStockIn ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
        const typeLabel = isStockIn ? 'Stock In' : 'Stock Out';
        const typeIcon = isStockIn ? '📦' : '📤';

        const historyItem = document.createElement('div');
        historyItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors';
        historyItem.innerHTML = `
            <div class="flex items-start gap-3 flex-1">
                <div class="pt-1">${typeIcon}</div>
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-gray-900">
                            ${typeLabel}: <span class="text-${isStockIn ? 'green' : 'blue'}-600">${record.quantity} units</span>
                        </span>
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeColor}">
                            ${typeLabel}
                        </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                        <span class="font-medium">${record.user_name || 'Unknown User'}</span> • ${formattedDate}
                    </p>
                    <p class="text-xs text-gray-600 mt-0.5">
                        ${record.reason || 'No reason provided'}
                    </p>
                    <p class="text-xs text-gray-500 mt-0.5">
                        Stock: ${record.previous_stock} → ${record.new_stock}
                    </p>
                </div>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Render detailed stock history in table format
export function renderDetailedStockHistory(data = fullStockHistoryData) {
    const tableBody = document.getElementById('detailedHistoryTable');
    const emptyState = document.getElementById('emptyHistoryState');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (data.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    data.forEach((record, index) => {
        const date = new Date(record.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const transactionType = record.transaction_type;
        const isStockIn = transactionType === 'stock_in';
        const typeColor = isStockIn ? 'text-green-600 bg-green-100' : transactionType === 'stock_out' ? 'text-blue-600 bg-blue-100' : 'text-purple-600 bg-purple-100';
        const typeLabel = isStockIn ? 'Stock In' : transactionType === 'stock_out' ? 'Stock Out' : 'Purchase';

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 cursor-pointer';
        row.onclick = () => openTransactionDetails(record);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="font-medium">${formattedDate}</div>
                <div class="text-xs text-gray-500">${formattedTime}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full ${typeColor}">
                    ${typeLabel}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 font-medium">${record.product_name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                <span class="text-${isStockIn ? 'green' : 'blue'}-600">${record.quantity} units</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.previous_stock}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.new_stock}</td>
            <td class="px-6 py-4 text-sm text-gray-900">
                <div class="font-medium">${record.user_name || 'Unknown'}</div>
                <div class="text-xs text-gray-500">${record.user_email || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title="${record.reason}">${record.reason || '—'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="window.openDetailedTransactionModal(event, ${index})" class="text-yellow-600 hover:text-yellow-700 font-medium">
                    View
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Show transaction details in modal
function openTransactionDetails(record) {
    const modal = document.getElementById('transactionDetailsModal');
    const content = document.getElementById('transactionDetailsContent');

    if (!modal || !content) return;

    const date = new Date(record.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const transactionType = record.transaction_type;
    const isStockIn = transactionType === 'stock_in';
    const typeColor = isStockIn ? 'bg-green-100 text-green-800' : transactionType === 'stock_out' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
    const typeLabel = isStockIn ? 'Stock In' : transactionType === 'stock_out' ? 'Stock Out' : 'Purchase';

    content.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="border-b border-gray-200 pb-4">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-xl font-bold text-gray-900">${record.product_name}</h4>
                    <span class="inline-flex px-3 py-1 text-sm font-semibold rounded-full ${typeColor}">
                        ${typeLabel}
                    </span>
                </div>
                <p class="text-sm text-gray-600">
                    ${formattedDate} at ${formattedTime}
                </p>
            </div>

            <!-- Transaction Details -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-xs font-medium text-gray-500 uppercase mb-1">Quantity</p>
                    <p class="text-2xl font-bold text-${isStockIn ? 'green' : 'blue'}-600">${record.quantity} units</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-xs font-medium text-gray-500 uppercase mb-1">Transaction Type</p>
                    <p class="text-xl font-bold text-gray-900">${typeLabel}</p>
                </div>
            </div>

            <!-- Stock Changes -->
            <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p class="text-sm font-medium text-gray-700 mb-3">Stock Level Changes</p>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs text-gray-600 mb-1">Previous Stock</p>
                        <p class="text-2xl font-bold text-gray-900">${record.previous_stock}</p>
                    </div>
                    <div class="text-center">
                        <svg class="w-6 h-6 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 9.414V17a1 1 0 11-2 0V9.414l-2.293 2.293a1 1 0 01-1.414-1.414l4-4z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-gray-600 mb-1">New Stock</p>
                        <p class="text-2xl font-bold text-gray-900">${record.new_stock}</p>
                    </div>
                </div>
            </div>

            <!-- User Information -->
            <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p class="text-sm font-medium text-gray-700 mb-2">Performed By</p>
                <p class="text-lg font-semibold text-gray-900">${record.user_name || 'Unknown User'}</p>
                <p class="text-sm text-gray-600 mt-1">${record.user_email || 'No email'}</p>
            </div>

            <!-- Reason -->
            <div class="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                <p class="text-sm font-medium text-gray-700 mb-2">Reason/Notes</p>
                <p class="text-sm text-gray-900 whitespace-pre-wrap">${record.reason || 'No reason provided'}</p>
            </div>

            <!-- Additional Info -->
            <div class="border-t border-gray-200 pt-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="text-xs text-gray-500 uppercase mb-1">Transaction ID</p>
                        <p class="font-mono text-gray-700">#${record.id}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase mb-1">Timestamp</p>
                        <p class="font-mono text-gray-700">${new Date(record.created_at).toISOString()}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Update statistics
function updateHistoryStatistics(data) {
    let totalStockIn = 0;
    let totalStockOut = 0;
    let lastTransactionDate = null;

    data.forEach(record => {
        if (record.transaction_type === 'stock_in') {
            totalStockIn += record.quantity;
        } else if (record.transaction_type === 'stock_out') {
            totalStockOut += record.quantity;
        }

        if (!lastTransactionDate) {
            lastTransactionDate = new Date(record.created_at);
        }
    });

    // Update DOM
    const stockInEl = document.getElementById('totalStockInCount');
    const stockOutEl = document.getElementById('totalStockOutCount');
    const transactionsEl = document.getElementById('totalTransactions');
    const lastDateEl = document.getElementById('lastTransactionDate');

    if (stockInEl) stockInEl.textContent = `${totalStockIn} units`;
    if (stockOutEl) stockOutEl.textContent = `${totalStockOut} units`;
    if (transactionsEl) transactionsEl.textContent = data.length;
    if (lastDateEl && lastTransactionDate) {
        lastDateEl.textContent = lastTransactionDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

// Filter detailed stock history
export function filterDetailedStockHistory() {
    const typeFilter = document.getElementById('detailedTypeFilter');
    const startDate = document.getElementById('detailedStartDate');
    const endDate = document.getElementById('detailedEndDate');
    const productSearch = document.getElementById('detailedProductSearch');

    if (!typeFilter || !startDate || !endDate || !productSearch) return;

    const selectedType = typeFilter.value;
    const startDateValue = startDate.value ? new Date(startDate.value) : null;
    const endDateValue = endDate.value ? new Date(endDate.value) : null;
    const searchTerm = productSearch.value.toLowerCase();

    const filtered = fullStockHistoryData.filter(record => {
        const matchesType = !selectedType || record.transaction_type === selectedType;
        
        let matchesDate = true;
        if (startDateValue || endDateValue) {
            const recordDate = new Date(record.created_at);
            if (startDateValue && recordDate < startDateValue) matchesDate = false;
            if (endDateValue) {
                endDateValue.setHours(23, 59, 59, 999);
                if (recordDate > endDateValue) matchesDate = false;
            }
        }

        const matchesProduct = !searchTerm || record.product_name.toLowerCase().includes(searchTerm);

        return matchesType && matchesDate && matchesProduct;
    });

    renderDetailedStockHistory(filtered);
    updateHistoryStatistics(filtered);
}

// Reset filters
export function resetDetailedStockHistoryFilters() {
    const typeFilter = document.getElementById('detailedTypeFilter');
    const startDate = document.getElementById('detailedStartDate');
    const endDate = document.getElementById('detailedEndDate');
    const productSearch = document.getElementById('detailedProductSearch');

    if (typeFilter) typeFilter.value = '';
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    if (productSearch) productSearch.value = '';

    renderDetailedStockHistory(fullStockHistoryData);
    updateHistoryStatistics(fullStockHistoryData);
}

// Filter stock history on dashboard
export function filterStockHistory() {
    const typeFilter = document.getElementById('stockHistoryTypeFilter');
    const dateFilter = document.getElementById('stockHistoryDateFilter');

    if (!typeFilter || !dateFilter) return;

    const selectedType = typeFilter.value;
    const selectedDate = dateFilter.value;

    const filtered = stockHistory.filter(record => {
        const matchesType = !selectedType || record.transaction_type === selectedType;
        
        let matchesDate = true;
        if (selectedDate) {
            const recordDate = new Date(record.created_at).toISOString().split('T')[0];
            matchesDate = recordDate === selectedDate;
        }

        return matchesType && matchesDate;
    });

    renderStockHistory(filtered);
}

// Get stock history for a specific product
export async function getProductStockHistory(productId) {
    try {
        const { data, error } = await supabase
            .from('stock_history')
            .select('*')
            .eq('inventory_id', productId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to load product stock history:', error.message);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error loading product stock history:', err);
        return [];
    }
}

// Get stock history summary
export async function getStockHistorySummary() {
    try {
        const { data, error } = await supabase
            .from('stock_history')
            .select('transaction_type, quantity')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (error) {
            console.error('Failed to load stock history summary:', error.message);
            return { totalStockIn: 0, totalStockOut: 0 };
        }

        const summary = {
            totalStockIn: 0,
            totalStockOut: 0
        };

        data.forEach(record => {
            if (record.transaction_type === 'stock_in') {
                summary.totalStockIn += record.quantity;
            } else if (record.transaction_type === 'stock_out') {
                summary.totalStockOut += record.quantity;
            }
        });

        return summary;
    } catch (err) {
        console.error('Error loading stock history summary:', err);
        return { totalStockIn: 0, totalStockOut: 0 };
    }
}

// Export transaction detail function to window for onclick handlers
if (typeof window !== 'undefined') {
    window.__stockHistoryModule = {
        openDetailedTransactionModal: (event, index) => {
            event.stopPropagation();
            const record = fullStockHistoryData[index];
            if (record) openTransactionDetails(record);
        }
    };
}