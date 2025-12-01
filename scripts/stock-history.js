// Stock History Module
import { supabase, departmentNames } from './config.js';

export let stockHistory = [];

// Load stock history from Supabase
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

// Render stock history table on dashboard
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
            <p>No stock history records</p>
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

// Filter stock history by type and date
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

// Get stock history summary for dashboard
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
