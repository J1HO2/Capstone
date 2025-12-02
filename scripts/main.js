// Main Application Script
import { loadComponent, loadPage } from './loader.js';
import { initializeNavigation } from './navigation.js';
import { loadInventory, renderInventory, deleteInventoryItem, filterInventory, recordStockTransaction, loadStockTransactions, renderStockActivity, clearStockTransactions, populateMonthFilter, exportStockHistoryCSV } from './inventory.js';
import { loadRooms, renderRooms, deleteRoom, updateRoomDropdown } from './rooms.js';
import { loadBookings, renderBookings, cancelLease, deleteLease } from './bookings.js';
import { loadStockHistory, renderStockHistory, filterStockHistory } from './stock-history.js';
import { loadDetailedStockHistory, filterDetailedStockHistory, resetDetailedStockHistoryFilters } from './stock-history-detailed.js';

// Global state for stock operations
let selectedProductId = null;
let currentStockAction = '';

// Global window functions for onclick handlers
window.deleteInventoryItem = deleteInventoryItem;
window.deleteRoom = deleteRoom;
window.cancelLease = cancelLease;
window.deleteLease = deleteLease;
window.loadStockTransactions = loadStockTransactions;
window.renderStockActivity = renderStockActivity;
window.clearStockTransactions = clearStockTransactions;
window.populateMonthFilter = populateMonthFilter;
window.exportStockHistoryCSV = exportStockHistoryCSV;

// Stock modal function
window.openStockModal = async function(productId, action) {
    const { supabase } = await import('./config.js');
    
    // Fetch product from database
    const { data: product, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', productId)
        .single();
    
    if (error || !product) {
        console.error('Failed to fetch product:', error);
        return;
    }

    selectedProductId = productId;
    currentStockAction = action;

    document.getElementById('stockProductName').value = product.name;
    document.getElementById('currentStock').value = product.stock;
    document.getElementById('stockUpdateTitle').textContent = action === 'in' ? 'Stock In' : 'Stock Out';
    document.getElementById('confirmStockUpdate').textContent = action === 'in' ? 'Add Stock' : 'Remove Stock';
    document.getElementById('stockQuantity').value = '';
    document.getElementById('stockReason').value = '';
    
    const modal = document.getElementById('stockUpdateModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

// Page initialization functions
window.initInventoryPage = async function() {
    await loadInventory();
    await loadStockTransactions();
    populateMonthFilter();
    
    // Attach event listeners for inventory page
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const departmentFilter = document.getElementById('departmentFilter');
    
    if (searchInput) searchInput.addEventListener('input', filterInventory);
    if (categoryFilter) categoryFilter.addEventListener('change', filterInventory);
    if (departmentFilter) departmentFilter.addEventListener('change', filterInventory);
    
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            const modal = document.getElementById('addProductModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    // Stock In/Out quick action buttons
    const stockInBtn = document.getElementById('stockInBtn');
    const stockOutBtn = document.getElementById('stockOutBtn');
    
    if (stockInBtn) {
        stockInBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Stock In',
                text: 'Click "Stock In" on any product in the table below to add stock',
                icon: 'info',
                confirmButtonColor: '#eab308'
            });
        });
    }
    
    if (stockOutBtn) {
        stockOutBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Stock Out',
                text: 'Click "Stock Out" on any product in the table below to remove stock',
                icon: 'info',
                confirmButtonColor: '#eab308'
            });
        });
    }
    
    // Stock Activity Tracker buttons
    const exportActivityBtn = document.getElementById('exportActivityBtn');
    const clearActivityBtn = document.getElementById('clearActivityBtn');
    
    if (exportActivityBtn) {
        exportActivityBtn.addEventListener('click', exportStockHistoryCSV);
    }
    
    if (clearActivityBtn) {
        clearActivityBtn.addEventListener('click', clearStockTransactions);
    }
};

window.initStockHistoryPage = async function() {
    await loadDetailedStockHistory();
    
    // Attach event listeners for filters
    const applyBtn = document.getElementById('applyFiltersBtn');
    const resetBtn = document.getElementById('resetFiltersBtn');
    const typeFilter = document.getElementById('detailedTypeFilter');
    const startDate = document.getElementById('detailedStartDate');
    const endDate = document.getElementById('detailedEndDate');
    const productSearch = document.getElementById('detailedProductSearch');
    
    if (applyBtn) applyBtn.addEventListener('click', filterDetailedStockHistory);
    if (resetBtn) resetBtn.addEventListener('click', resetDetailedStockHistoryFilters);
    if (typeFilter) typeFilter.addEventListener('change', filterDetailedStockHistory);
    if (startDate) startDate.addEventListener('change', filterDetailedStockHistory);
    if (endDate) endDate.addEventListener('change', filterDetailedStockHistory);
    if (productSearch) productSearch.addEventListener('input', filterDetailedStockHistory);
    
    // Export button (if needed in future)
    const exportBtn = document.getElementById('exportHistoryBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Export Feature',
                text: 'PDF export feature coming soon!',
                icon: 'info',
                confirmButtonColor: '#eab308'
            });
        });
    }
};

window.openDetailedTransactionModal = function(event, index) {
    event.stopPropagation();
    const { openDetailedTransactionModal } = window.__stockHistoryModule;
    if (openDetailedTransactionModal) {
        openDetailedTransactionModal(event, index);
    }
};

window.initRoomsPage = async function() {
    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await loadRooms();
    await loadBookings();
    
    // Add another small delay to ensure buttons are in DOM
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Attach event listeners for rooms page
    const addRoomBtn = document.getElementById('addRoomBtn');
    if (addRoomBtn && !addRoomBtn.dataset.bound) {
        addRoomBtn.dataset.bound = 'true';
        addRoomBtn.addEventListener('click', () => {
            console.log('✅ Add Room button clicked');
            const modal = document.getElementById('addRoomModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                console.log('✅ Add Room Modal opened');
            } else {
                console.error('❌ Add Room Modal not found');
            }
        });
        console.log('✅ Add Room button listener attached');
    } else if (!addRoomBtn) {
        console.warn('⚠️ Add Room button not found in DOM!');
    }
    
    const newBookingBtn = document.getElementById('newBookingBtn');
    if (newBookingBtn && !newBookingBtn.dataset.bound) {
        newBookingBtn.dataset.bound = 'true';
        newBookingBtn.addEventListener('click', () => {
            console.log('✅ New Booking button clicked');
            updateRoomDropdown(); // Update available rooms in dropdown
            const modal = document.getElementById('newBookingModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                console.log('✅ New Booking Modal opened');
            } else {
                console.error('❌ New Booking Modal not found');
            }
        });
        console.log('✅ New Booking button listener attached');
    } else if (!newBookingBtn) {
        console.warn('⚠️ New Booking button not found in DOM!');
    }
    
    // Add Payment button
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    if (addPaymentBtn && !addPaymentBtn.dataset.bound) {
        addPaymentBtn.dataset.bound = 'true';
        addPaymentBtn.addEventListener('click', async () => {
            console.log('✅ Add Payment button clicked');
            // Close all other modals first
            closeModal('addCreditModal');
            
            await populateLeaseDropdown('paymentLease');
            generateReceiptNumber();
            openModal('addPaymentModal');
            console.log('✅ Add Payment Modal opened');
        });
        console.log('✅ Add Payment button listener attached');
    } else if (!addPaymentBtn) {
        console.warn('⚠️ Add Payment button not found in DOM!');
    }
    
    // Add Credit button - BULLETPROOF VERSION
    const addCreditBtn = document.getElementById('addCreditBtn');
    if (addCreditBtn && !addCreditBtn.dataset.bound) {
        // Prevent duplicate listeners
        addCreditBtn.dataset.bound = 'true';
        addCreditBtn.addEventListener('click', async () => {
            try {
                console.log('💳 Add Credit button clicked!');
                console.log('🔍 Checking modal availability...');
                
                // Close all other modals first
                ['addPaymentModal', 'addRoomModal', 'newBookingModal'].forEach(modalId => {
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                        modal.style.display = 'none';
                    }
                });
                
                // Check if modal exists
                const creditModal = document.getElementById('addCreditModal');
                if (!creditModal) {
                    console.error('❌ Add Credit modal not found in DOM');
                    throw new Error('Add Credit modal not found. Please refresh the page.');
                }
                
                console.log('✅ Credit modal found, opening...');
                
                // Clear and open modal
                const form = document.getElementById('addCreditForm');
                if (form) form.reset();
                
                creditModal.classList.remove('hidden');
                creditModal.classList.add('flex');
                creditModal.style.display = 'flex';
                
                console.log('✅ Credit modal opened');
                
                // Populate lease dropdown with error handling
                setTimeout(async () => {
                    try {
                        console.log('🔄 Populating lease dropdown...');
                        await populateLeaseDropdown('creditLease');
                        console.log('✅ Lease dropdown populated successfully');
                    } catch (dropdownError) {
                        console.error('❌ Error populating dropdown:', dropdownError);
                        const creditLease = document.getElementById('creditLease');
                        if (creditLease) {
                            creditLease.innerHTML = '<option value="">Error loading leases - please refresh</option>';
                        }
                        // Show user-friendly warning
                        Swal.fire({
                            icon: 'warning',
                            title: 'Loading Issue',
                            text: 'Could not load lease options. You can still use the form but may need to refresh.',
                            toast: true,
                            position: 'bottom-end',
                            showConfirmButton: false,
                            timer: 4000
                        });
                    }
                }, 300);
                
            } catch (error) {
                console.error('❌ Critical error with Add Credit button:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Cannot Open Add Credit',
                    text: error.message || 'Failed to open Add Credit modal. Please refresh the page.',
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'OK'
                });
            }
        });
        console.log('✅ Add Credit button listener attached (bulletproof version)');
    } else if (!addCreditBtn) {
        console.error('❌ Add Credit button not found in DOM!');
        
        // Try to find it with a delay
        setTimeout(() => {
            const lateBtn = document.getElementById('addCreditBtn');
            if (lateBtn && !lateBtn.dataset.bound) {
                console.log('🔄 Found Add Credit button with delay, attaching listener...');
                lateBtn.dataset.bound = 'true';
                // Re-run the same logic
                lateBtn.click();
            }
        }, 1000);
    }
};

window.initAccountingPage = async function() {
    console.log('Accounting page initialized');
    await loadAccountingData();
    setupAccountingFilters();
};

// Load and display accounting data
async function loadAccountingData() {
    try {
        const { supabase } = await import('./config.js');
        
        // Fetch all financial data
        const [paymentsResult, creditsResult, inventoryResult, bookingsResult] = await Promise.all([
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('credits').select('*').order('created_at', { ascending: false }),
            supabase.from('inventory').select('*'),
            supabase.from('bookings').select('*')
        ]);
        
        const payments = paymentsResult.data || [];
        const credits = creditsResult.data || [];
        const inventory = inventoryResult.data || [];
        const bookings = bookingsResult.data || [];
        
        // Calculate totals
        const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const totalCredits = credits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const totalRevenue = totalPayments + totalCredits;
        
        // Calculate inventory value
        const inventoryValue = inventory.reduce((sum, item) => 
            sum + ((parseFloat(item.price) || 0) * (parseInt(item.stock) || 0)), 0
        );
        
        // Calculate monthly revenue
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        const thisMonthPayments = payments.filter(p => {
            const date = new Date(p.created_at || p.payment_date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const thisMonthCredits = credits.filter(c => {
            const date = new Date(c.created_at || c.credit_date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        
        const monthlyRevenue = thisMonthPayments + thisMonthCredits;
        
        const lastMonthPayments = payments.filter(p => {
            const date = new Date(p.created_at || p.payment_date);
            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const lastMonthCredits = credits.filter(c => {
            const date = new Date(c.created_at || c.credit_date);
            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        }).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        
        const lastMonthRevenue = lastMonthPayments + lastMonthCredits;
        
        // Update dashboard cards
        document.getElementById('totalRevenue').textContent = `₱${totalRevenue.toLocaleString()}`;
        document.getElementById('monthlyRevenue').textContent = `₱${monthlyRevenue.toLocaleString()}`;
        document.getElementById('inventoryValue').textContent = `₱${inventoryValue.toLocaleString()}`;
        
        // Revenue breakdown
        const rentPayments = payments.filter(p => p.payment_type === 'Rent' || p.lease_id).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const deposits = payments.filter(p => p.payment_type === 'Deposit' || p.payment_type === 'Security Deposit').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const inventorySales = 0; // Placeholder for future inventory sales tracking
        
        document.getElementById('inventorySalesTotal').textContent = `₱${inventorySales.toLocaleString()}`;
        document.getElementById('rentalRevenueTotal').textContent = `₱${rentPayments.toLocaleString()}`;
        document.getElementById('depositsTotal').textContent = `₱${deposits.toLocaleString()}`;
        document.getElementById('totalRevenueBreakdown').textContent = `₱${totalRevenue.toLocaleString()}`;
        
        // Monthly performance
        document.getElementById('thisMonthRevenue').textContent = `₱${monthlyRevenue.toLocaleString()}`;
        document.getElementById('lastMonthRevenue').textContent = `₱${lastMonthRevenue.toLocaleString()}`;
        
        // Calculate growth
        const growth = lastMonthRevenue > 0 
            ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
            : 0;
        const growthElement = document.getElementById('monthlyGrowth');
        growthElement.textContent = `${growth}%`;
        growthElement.className = `text-sm font-medium ${parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'}`;
        
        // Calculate daily average
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyAverage = monthlyRevenue / daysInMonth;
        document.getElementById('dailyAverage').textContent = `₱${dailyAverage.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        
        // Load transaction history
        loadTransactionHistory(payments, credits);
        
        console.log('✅ Accounting data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading accounting data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load accounting data',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Load transaction history
function loadTransactionHistory(payments, credits) {
    const tableBody = document.getElementById('transactionsTable');
    if (!tableBody) return;
    
    // Combine payments and credits into transactions
    const transactions = [
        ...payments.map(p => ({
            date: new Date(p.created_at || p.payment_date),
            type: 'rental_payment',
            typeLabel: 'Rental Payment',
            description: `Payment - ${p.payment_method || 'Cash'} ${p.receipt_number ? `(${p.receipt_number})` : ''}`,
            amount: parseFloat(p.amount) || 0,
            notes: p.notes || ''
        })),
        ...credits.map(c => ({
            date: new Date(c.created_at || c.credit_date),
            type: 'rental_credit',
            typeLabel: 'Credit',
            description: `Credit - ${c.reason || 'Adjustment'}`,
            amount: parseFloat(c.amount) || 0,
            notes: c.notes || ''
        }))
    ].sort((a, b) => b.date - a.date);
    
    if (transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    No transactions found.
                </td>
            </tr>
        `;
        return;
    }
    
    // Calculate running balance
    let runningBalance = 0;
    
    tableBody.innerHTML = transactions.map(transaction => {
        runningBalance += transaction.amount;
        
        const typeColor = transaction.type === 'rental_payment' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
        
        return `
            <tr class="hover:bg-gray-50" data-type="${transaction.type}">
                <td class="px-6 py-4 text-sm text-gray-900">${transaction.date.toLocaleDateString()}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}">
                        ${transaction.typeLabel}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">${transaction.description}</td>
                <td class="px-6 py-4 text-sm font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ₱${transaction.amount.toLocaleString()}
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                    ₱${runningBalance.toLocaleString()}
                </td>
            </tr>
        `;
    }).join('');
}

// Setup accounting filters
function setupAccountingFilters() {
    const filterSelect = document.getElementById('transactionFilter');
    const exportBtn = document.getElementById('exportTransactionsBtn');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const filterValue = this.value;
            const rows = document.querySelectorAll('#transactionsTable tr');
            
            rows.forEach(row => {
                const type = row.dataset.type;
                if (!filterValue || type === filterValue) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportAccountingToCSV();
        });
    }
}

// Export accounting data to CSV
async function exportAccountingToCSV() {
    try {
        const { supabase } = await import('./config.js');
        
        // Fetch all financial data
        const [paymentsResult, creditsResult] = await Promise.all([
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('credits').select('*').order('created_at', { ascending: false })
        ]);
        
        const payments = paymentsResult.data || [];
        const credits = creditsResult.data || [];
        
        // Combine into transactions
        const transactions = [
            ...payments.map(p => ({
                date: new Date(p.created_at || p.payment_date),
                type: 'Rental Payment',
                description: `Payment - ${p.payment_method || 'Cash'} ${p.receipt_number ? `(${p.receipt_number})` : ''}`,
                amount: parseFloat(p.amount) || 0,
                notes: (p.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
            })),
            ...credits.map(c => ({
                date: new Date(c.created_at || c.credit_date),
                type: 'Credit',
                description: `Credit - ${c.reason || 'Adjustment'}`,
                amount: parseFloat(c.amount) || 0,
                notes: (c.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
            }))
        ].sort((a, b) => b.date - a.date);
        
        if (transactions.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No transactions available to export.',
                confirmButtonColor: '#eab308'
            });
            return;
        }
        
        // Calculate running balance
        let runningBalance = 0;
        const transactionsWithBalance = transactions.map(t => {
            runningBalance += t.amount;
            return { ...t, balance: runningBalance };
        });
        
        // Generate CSV content
        const csvHeaders = ['Date', 'Type', 'Description', 'Amount (₱)', 'Balance (₱)', 'Notes'];
        const csvRows = transactionsWithBalance.map(t => [
            t.date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            t.type,
            `"${t.description}"`,
            t.amount.toFixed(2),
            t.balance.toFixed(2),
            `"${t.notes}"`
        ]);
        
        // Create CSV string
        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const currentDate = new Date();
        const dateStr = currentDate.toISOString().split('T')[0];
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Accounting_Report_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Swal.fire({
            icon: 'success',
            title: 'Export Successful',
            text: `Accounting report exported successfully!`,
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        console.error('❌ Error exporting accounting data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: 'Failed to export accounting data.',
            confirmButtonColor: '#eab308'
        });
    }
}

window.initPaymentSummaryPage = async function() {
    console.log('Payment & Credit Tracker page initialized');
    await loadPaymentSummaryData();
    setupPaymentExport();
};

// Load and display payment summary data
async function loadPaymentSummaryData() {
    try {
        const { supabase } = await import('./config.js');
        
        // Fetch all data
        const [paymentsResult, creditsResult, bookingsResult] = await Promise.all([
            supabase.from('payments').select('*, bookings(tenant, client_name, room_name)').order('created_at', { ascending: false }),
            supabase.from('credits').select('*, bookings(tenant, client_name, room_name)').order('created_at', { ascending: false }),
            supabase.from('bookings').select('*').eq('status', 'Active')
        ]);
        
        const payments = paymentsResult.data || [];
        const credits = creditsResult.data || [];
        const bookings = bookingsResult.data || [];
        
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Calculate paid this month
        const paidThisMonth = payments.filter(p => {
            const paymentDate = new Date(p.created_at || p.payment_date);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        // Calculate overdue and upcoming payments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const oneWeekFromNow = new Date(today);
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        
        let overdueAmount = 0;
        let overdueCount = 0;
        let dueThisWeek = 0;
        let dueCount = 0;
        let totalBalance = 0;
        let onTimePayments = 0;
        let totalExpectedPayments = 0;
        
        const overdueLeases = [];
        
        bookings.forEach(booking => {
            const balance = parseFloat(booking.balance) || 0;
            totalBalance += balance;
            
            if (balance > 0) {
                // Calculate next due date (monthly rent)
                const leaseStart = new Date(booking.lease_start || booking.start_date);
                const monthlyRent = parseFloat(booking.monthly_rent || booking.rent) || 0;
                
                // Calculate which month we're in for the lease
                const monthsSinceStart = Math.floor((today - leaseStart) / (30 * 24 * 60 * 60 * 1000));
                const nextDueDate = new Date(leaseStart);
                nextDueDate.setMonth(nextDueDate.getMonth() + monthsSinceStart + 1);
                nextDueDate.setHours(0, 0, 0, 0);
                
                const daysOverdue = Math.floor((today - nextDueDate) / (24 * 60 * 60 * 1000));
                
                totalExpectedPayments++;
                
                if (today > nextDueDate) {
                    // Overdue
                    overdueAmount += balance;
                    overdueCount++;
                    
                    // Calculate late fee (₱50 per day after 3 days grace period)
                    const lateFee = daysOverdue > 3 ? (daysOverdue - 3) * 50 : 0;
                    
                    overdueLeases.push({
                        tenant: booking.tenant || booking.client_name || 'N/A',
                        room: booking.room_name || 'N/A',
                        dueDate: nextDueDate,
                        daysOverdue: daysOverdue,
                        amountDue: balance,
                        lateFee: lateFee,
                        totalDue: balance + lateFee,
                        monthlyRent: monthlyRent,
                        leaseId: booking.id,
                        contact: booking.contact || booking.client_contact || 'N/A'
                    });
                } else if (nextDueDate <= oneWeekFromNow) {
                    // Due this week
                    dueThisWeek += balance;
                    dueCount++;
                    
                    overdueLeases.push({
                        tenant: booking.tenant || booking.client_name || 'N/A',
                        room: booking.room_name || 'N/A',
                        dueDate: nextDueDate,
                        daysOverdue: 0,
                        amountDue: balance,
                        lateFee: 0,
                        totalDue: balance,
                        monthlyRent: monthlyRent,
                        leaseId: booking.id,
                        contact: booking.contact || booking.client_contact || 'N/A',
                        isDueSoon: true
                    });
                } else {
                    onTimePayments++;
                }
            } else {
                onTimePayments++;
            }
        });
        
        // Calculate collection rate
        const collectionRate = totalExpectedPayments > 0 
            ? Math.round((onTimePayments / totalExpectedPayments) * 100)
            : 100;
        
        // Update dashboard cards
        document.getElementById('psPaidThisMonth').textContent = `₱${paidThisMonth.toLocaleString()}`;
        document.getElementById('psOverdueAmount').textContent = `₱${overdueAmount.toLocaleString()}`;
        document.getElementById('psOverdueCount').textContent = overdueCount;
        document.getElementById('psDueThisWeek').textContent = `₱${dueThisWeek.toLocaleString()}`;
        document.getElementById('psDueCount').textContent = dueCount;
        document.getElementById('psTotalBalance').textContent = `₱${totalBalance.toLocaleString()}`;
        document.getElementById('psCollectionRate').textContent = `${collectionRate}%`;
        
        // Show/hide overdue alert
        const overdueAlert = document.getElementById('overdueAlert');
        const overdueMessage = document.getElementById('overdueMessage');
        if (overdueCount > 0) {
            overdueAlert.classList.remove('hidden');
            overdueMessage.textContent = `${overdueCount} tenant(s) have overdue payments totaling ₱${overdueAmount.toLocaleString()}. Late fees may apply after 3 days.`;
        } else {
            overdueAlert.classList.add('hidden');
        }
        
        // Load overdue table
        loadOverdueTable(overdueLeases);
        
        // Populate lease filter dropdown
        populateLeaseFilter(bookings);
        
        // Load activity table
        loadPaymentActivityTable(payments, credits);
        
        // Load charts
        loadPaymentCharts(payments, credits);
        
        // Setup filters
        setupPaymentFilters(payments, credits);
        
        console.log('✅ Payment & Credit Tracker data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading payment tracker data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load payment tracker data',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Load overdue payments table
function loadOverdueTable(overdueLeases) {
    const tableBody = document.getElementById('psOverdueTable');
    if (!tableBody) return;
    
    // Sort by days overdue (highest first)
    overdueLeases.sort((a, b) => b.daysOverdue - a.daysOverdue);
    
    if (overdueLeases.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center">
                        <svg class="w-16 h-16 text-green-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <p class="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</p>
                        <p class="text-sm text-gray-500">No overdue or upcoming payments at this time.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = overdueLeases.map(lease => {
        const statusBadge = lease.isDueSoon
            ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Due Soon</span>'
            : lease.daysOverdue > 30
            ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Critical</span>'
            : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Overdue</span>';
        
        const rowClass = lease.isDueSoon ? 'bg-yellow-50' : lease.daysOverdue > 30 ? 'bg-red-50' : 'bg-orange-50';
        
        return `
            <tr class="${rowClass} hover:bg-opacity-75 transition">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${lease.tenant}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${lease.room}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${lease.dueDate.toLocaleDateString()}</td>
                <td class="px-6 py-4 text-sm font-semibold ${lease.daysOverdue > 0 ? 'text-red-600' : 'text-green-600'}">
                    ${lease.daysOverdue > 0 ? `${lease.daysOverdue} days` : 'On Time'}
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">₱${lease.amountDue.toLocaleString()}</td>
                <td class="px-6 py-4 text-sm font-semibold ${lease.lateFee > 0 ? 'text-red-600' : 'text-gray-500'}">
                    ${lease.lateFee > 0 ? `₱${lease.lateFee.toLocaleString()}` : '—'}
                </td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900">₱${lease.totalDue.toLocaleString()}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-center">
                    <button onclick="window.sendPaymentReminder(${lease.leaseId}, '${lease.tenant}', '${lease.contact}')" 
                        class="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                        Send Reminder
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Send payment reminder function
window.sendPaymentReminder = function(leaseId, tenantName, contact) {
    Swal.fire({
        title: 'Send Payment Reminder',
        html: `
            <p class="text-left mb-4">Send reminder to <strong>${tenantName}</strong></p>
            <p class="text-left text-sm text-gray-600 mb-2">Contact: ${contact}</p>
            <textarea id="reminderMessage" class="w-full border border-gray-300 rounded-lg p-3 text-sm" rows="4" placeholder="Enter reminder message...">Dear ${tenantName},

This is a friendly reminder that your rent payment is overdue. Please settle your balance at your earliest convenience to avoid additional late fees.

Thank you!</textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'Send Reminder',
        confirmButtonColor: '#3b82f6',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
            return document.getElementById('reminderMessage').value;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // In a real application, this would send SMS/email
            Swal.fire({
                icon: 'success',
                title: 'Reminder Sent!',
                text: `Payment reminder sent to ${tenantName}`,
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    });
};

// Setup payment export
function setupPaymentExport() {
    const exportBtn = document.getElementById('psExportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            await exportPaymentTrackerCSV();
        });
    }
}

// Export payment tracker to CSV
async function exportPaymentTrackerCSV() {
    try {
        const { supabase } = await import('./config.js');
        
        const [paymentsResult, bookingsResult] = await Promise.all([
            supabase.from('payments').select('*, bookings(tenant, client_name, room_name, balance, monthly_rent)').order('created_at', { ascending: false }),
            supabase.from('bookings').select('*').eq('status', 'Active')
        ]);
        
        const payments = paymentsResult.data || [];
        const bookings = bookingsResult.data || [];
        
        // Prepare CSV data
        const csvData = [];
        
        // Add header
        csvData.push(['Tenant', 'Room', 'Payment Date', 'Amount Paid', 'Balance', 'Payment Method', 'Receipt Number', 'Notes']);
        
        // Add payment rows
        payments.forEach(p => {
            csvData.push([
                p.bookings?.tenant || p.bookings?.client_name || 'N/A',
                p.bookings?.room_name || 'N/A',
                new Date(p.created_at || p.payment_date).toLocaleDateString(),
                parseFloat(p.amount || 0).toFixed(2),
                parseFloat(p.bookings?.balance || 0).toFixed(2),
                p.payment_method || 'Cash',
                p.receipt_number || '—',
                `"${(p.notes || '').replace(/"/g, '""')}"`
            ]);
        });
        
        // Create CSV string
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Payment_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Swal.fire({
            icon: 'success',
            title: 'Export Successful',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        console.error('❌ Error exporting payment tracker:', error);
        Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            confirmButtonColor: '#eab308'
        });
    }
}

// Populate lease filter dropdown
function populateLeaseFilter(bookings) {
    const leaseFilter = document.getElementById('psFilterLease');
    if (!leaseFilter) return;
    
    leaseFilter.innerHTML = '<option value="">All leases</option>';
    bookings.forEach(booking => {
        const option = document.createElement('option');
        option.value = booking.id;
        option.textContent = `${booking.tenant || booking.client_name || 'Unknown'} - ${booking.room_name || 'N/A'}`;
        leaseFilter.appendChild(option);
    });
}

// Load payment activity table
function loadPaymentActivityTable(payments, credits) {
    const tableBody = document.getElementById('psActivityTable');
    if (!tableBody) return;
    
    // Combine payments and credits
    const activities = [
        ...payments.map(p => ({
            date: new Date(p.created_at || p.payment_date),
            tenant: p.bookings?.tenant || p.bookings?.client_name || 'N/A',
            room: p.bookings?.room_name || 'N/A',
            type: 'Payment',
            amount: parseFloat(p.amount) || 0,
            note: p.notes || p.payment_method || '—',
            lease_id: p.lease_id,
            raw_type: 'rental_payment'
        })),
        ...credits.map(c => ({
            date: new Date(c.created_at || c.credit_date),
            tenant: c.bookings?.tenant || c.bookings?.client_name || 'N/A',
            room: c.bookings?.room_name || 'N/A',
            type: 'Credit',
            amount: parseFloat(c.amount) || 0,
            note: c.notes || c.reason || '—',
            lease_id: c.lease_id,
            raw_type: 'rental_credit'
        }))
    ].sort((a, b) => b.date - a.date);
    
    if (activities.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    No payment or credit activity found.
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = activities.map(activity => `
        <tr class="hover:bg-gray-50" data-lease-id="${activity.lease_id}" data-type="${activity.raw_type}">
            <td class="px-6 py-4 text-sm text-gray-900">${activity.date.toLocaleDateString()}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${activity.tenant}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${activity.room}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.type === 'Payment' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                    ${activity.type}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-semibold ${activity.type === 'Payment' ? 'text-green-600' : 'text-blue-600'}">
                ₱${activity.amount.toLocaleString()}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${activity.note}</td>
        </tr>
    `).join('');
}

// Load payment charts (placeholder - requires Chart.js)
function loadPaymentCharts(payments, credits) {
    // Get last 12 months data
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            month: date.getMonth(),
            year: date.getFullYear(),
            payments: 0,
            credits: 0
        });
    }
    
    // Aggregate payments by month
    payments.forEach(p => {
        const date = new Date(p.created_at || p.payment_date);
        const monthData = months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
        if (monthData) {
            monthData.payments += parseFloat(p.amount) || 0;
        }
    });
    
    // Aggregate credits by month
    credits.forEach(c => {
        const date = new Date(c.created_at || c.credit_date);
        const monthData = months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
        if (monthData) {
            monthData.credits += parseFloat(c.amount) || 0;
        }
    });
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded, skipping charts');
        return;
    }
    
    // Payments Chart
    const paymentsCtx = document.getElementById('psPaymentsChart');
    if (paymentsCtx) {
        new Chart(paymentsCtx, {
            type: 'line',
            data: {
                labels: months.map(m => m.label),
                datasets: [{
                    label: 'Payments',
                    data: months.map(m => m.payments),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '₱' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }
    
    // Credits Chart
    const creditsCtx = document.getElementById('psCreditsChart');
    if (creditsCtx) {
        new Chart(creditsCtx, {
            type: 'line',
            data: {
                labels: months.map(m => m.label),
                datasets: [{
                    label: 'Credits',
                    data: months.map(m => m.credits),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '₱' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }
}

// Setup payment filters
function setupPaymentFilters(payments, credits) {
    const leaseFilter = document.getElementById('psFilterLease');
    const typeFilter = document.getElementById('psFilterType');
    
    const applyFilters = () => {
        const selectedLease = leaseFilter?.value || '';
        const selectedType = typeFilter?.value || '';
        
        const rows = document.querySelectorAll('#psActivityTable tr');
        rows.forEach(row => {
            const leaseId = row.dataset.leaseId;
            const type = row.dataset.type;
            
            const leaseMatch = !selectedLease || leaseId === selectedLease;
            const typeMatch = !selectedType || type === selectedType;
            
            if (leaseMatch && typeMatch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };
    
    if (leaseFilter) leaseFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
}

window.initDashboardPage = async function() {
    console.log('Dashboard page initialized');
    await loadDashboardData();
    
    // Load stock history
    await loadStockHistory();
    
    // Attach event listeners for stock history filters
    const typeFilter = document.getElementById('stockHistoryTypeFilter');
    const dateFilter = document.getElementById('stockHistoryDateFilter');
    
    if (typeFilter) typeFilter.addEventListener('change', filterStockHistory);
    if (dateFilter) dateFilter.addEventListener('change', filterStockHistory);
    
    // Dashboard "View All" buttons
    const viewAllTransactionsBtn = document.getElementById('viewAllTransactions');
    if (viewAllTransactionsBtn && !viewAllTransactionsBtn.dataset.bound) {
        viewAllTransactionsBtn.dataset.bound = 'true';
        viewAllTransactionsBtn.addEventListener('click', async () => {
            console.log('➡️ View All Transactions clicked');
            // Update page title/subtitle
            const titleEl = document.getElementById('pageTitle');
            const subtitleEl = document.getElementById('pageSubtitle');
            if (titleEl) titleEl.textContent = 'Payment & Credit Tracker';
            if (subtitleEl) subtitleEl.textContent = 'Monitor overdue payments, track balances, and manage due dates';

            // Load the payment-summary page and initialize
            await loadPage('pages/payment-summary.html', 'mainContent');
            if (window.initPaymentSummaryPage) await window.initPaymentSummaryPage();
        });
        console.log('✅ viewAllTransactions listener attached');
    }

    const viewAllStockHistoryBtn = document.getElementById('viewAllStockHistory');
    if (viewAllStockHistoryBtn && !viewAllStockHistoryBtn.dataset.bound) {
        viewAllStockHistoryBtn.dataset.bound = 'true';
        viewAllStockHistoryBtn.addEventListener('click', async () => {
            console.log('➡️ View All Stock History clicked');
            const titleEl = document.getElementById('pageTitle');
            const subtitleEl = document.getElementById('pageSubtitle');
            if (titleEl) titleEl.textContent = 'Stock History';
            if (subtitleEl) subtitleEl.textContent = 'Detailed stock in/out records';

            await loadPage('pages/stock-history.html', 'mainContent');
            if (window.initStockHistoryPage) await window.initStockHistoryPage();
        });
        console.log('✅ viewAllStockHistory listener attached');
    }

    // Setup real-time listeners for stock history updates
    setupRealtimeStockHistoryListener();
};

// Setup real-time listener for stock history changes
async function setupRealtimeStockHistoryListener() {
    try {
        const { supabase } = await import('./config.js');
        
        // Listen for new stock history records (inserts)
        const subscription = supabase
            .channel('stock_history_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'stock_history'
                },
                async (payload) => {
                    console.log('🔄 Real-time stock history update received:', payload.new);
                    
                    // Reload stock history to show new transaction
                    if (typeof loadStockHistory === 'function') {
                        await loadStockHistory();
                    }
                    
                    // Show toast notification
                    const record = payload.new;
                    const transactionType = record.transaction_type === 'stock_in' ? 'Stock In' : 'Stock Out';
                    const icon = record.transaction_type === 'stock_in' ? 'success' : 'info';
                    const color = record.transaction_type === 'stock_in' ? '#10b981' : '#3b82f6';
                    
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: icon,
                        title: `📊 ${transactionType}: ${record.quantity} units`,
                        text: `User: ${record.user_name || 'Unknown'}`,
                        showConfirmButton: false,
                        timer: 4000,
                        background: '#fff',
                        color: '#000',
                        width: '22rem',
                        customClass: {
                            popup: 'rounded-lg shadow border-l-4 border-gray-200',
                            title: 'font-bold text-lg'
                        },
                        didOpen: (toast) => {
                            toast.style.borderLeftColor = color;
                        }
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Real-time stock history listener subscribed');
                }
            });
        
        // Store subscription reference for cleanup if needed
        window.__stockHistorySubscription = subscription;
    } catch (err) {
        console.error('⚠️ Error setting up real-time listener:', err);
    }
}

// Load and display dashboard statistics
async function loadDashboardData() {
    try {
        const { supabase } = await import('./config.js');
        
        // Fetch all data in parallel
        const [inventoryResult, roomsResult, bookingsResult, paymentsResult, creditsResult] = await Promise.all([
            supabase.from('inventory').select('*'),
            supabase.from('rooms').select('*'),
            supabase.from('bookings').select('*'),
            supabase.from('payments').select('*'),
            supabase.from('credits').select('*')
        ]);
        
        const inventory = inventoryResult.data || [];
        const rooms = roomsResult.data || [];
        const bookings = bookingsResult.data || [];
        const payments = paymentsResult.data || [];
        const credits = creditsResult.data || [];
        
        // Calculate statistics
        
        // Total Products
        const totalProducts = inventory.length;
        document.getElementById('dashTotalProducts').textContent = totalProducts;
        
        // Inventory Status
        const inStock = inventory.filter(item => item.stock > 10).length;
        const lowStock = inventory.filter(item => item.stock > 0 && item.stock <= 10).length;
        const outOfStock = inventory.filter(item => item.stock === 0).length;
        
        document.getElementById('dashInStock').textContent = inStock;
        document.getElementById('dashLowStock').textContent = lowStock;
        document.getElementById('dashOutStock').textContent = outOfStock;
        
        // Active Leases
        const activeLeases = bookings.filter(b => b.status === 'Active').length;
        document.getElementById('dashActiveLeases').textContent = activeLeases;
        
        // Room Occupancy
        const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
        const availableRooms = rooms.filter(r => r.status === 'Available').length;
        const totalRooms = rooms.length;
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
        
        document.getElementById('dashOccupied').textContent = occupiedRooms;
        document.getElementById('dashAvailable').textContent = availableRooms;
        document.getElementById('dashOccupancyRate').textContent = `${occupancyRate}%`;
        
        // Revenue Calculations
        const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const totalCredits = credits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const totalRevenue = totalPayments + totalCredits;
        
        document.getElementById('dashTotalRevenue').textContent = `₱${totalRevenue.toLocaleString()}`;
        
        // Monthly Revenue (current month)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyPayments = payments.filter(p => {
            const paymentDate = new Date(p.created_at || p.payment_date);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const monthlyCredits = credits.filter(c => {
            const creditDate = new Date(c.created_at || c.credit_date);
            return creditDate.getMonth() === currentMonth && creditDate.getFullYear() === currentYear;
        }).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        
        const monthlyRevenue = monthlyPayments + monthlyCredits;
        document.getElementById('dashMonthlyRevenue').textContent = `₱${monthlyRevenue.toLocaleString()}`;
        
        // Revenue Breakdown
        // For inventory sales, we'll need to track sales separately
        // For now, we'll show payments and credits breakdown
        const roomRentals = payments.filter(p => p.payment_type === 'Rent' || p.lease_id).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const deposits = payments.filter(p => p.payment_type === 'Deposit' || p.payment_type === 'Security Deposit').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const inventorySales = 0; // Placeholder for future sales tracking
        
        document.getElementById('dashInventorySales').textContent = `₱${inventorySales.toLocaleString()}`;
        document.getElementById('dashRoomRentals').textContent = `₱${roomRentals.toLocaleString()}`;
        document.getElementById('dashDeposits').textContent = `₱${deposits.toLocaleString()}`;
        
        // Recent Transactions
        loadRecentTransactions(payments, credits);
        
        console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load dashboard data',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Load recent transactions
function loadRecentTransactions(payments, credits) {
    const transactionsList = document.getElementById('recentTransactionsList');
    if (!transactionsList) return;
    
    // Combine and sort transactions by date
    const allTransactions = [
        ...payments.map(p => ({
            type: 'Payment',
            amount: parseFloat(p.amount) || 0,
            date: new Date(p.created_at || p.payment_date),
            description: p.payment_method || 'Payment',
            lease: p.lease_id ? `Lease #${p.lease_id}` : ''
        })),
        ...credits.map(c => ({
            type: 'Credit',
            amount: parseFloat(c.amount) || 0,
            date: new Date(c.created_at || c.credit_date),
            description: c.reason || 'Credit',
            lease: c.lease_id ? `Lease #${c.lease_id}` : ''
        }))
    ].sort((a, b) => b.date - a.date).slice(0, 5); // Get 5 most recent
    
    if (allTransactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                </svg>
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }
    
    transactionsList.innerHTML = allTransactions.map(t => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-full ${t.type === 'Payment' ? 'bg-green-100' : 'bg-blue-100'} flex items-center justify-center">
                        <svg class="w-5 h-5 ${t.type === 'Payment' ? 'text-green-600' : 'text-blue-600'}" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-900">${t.description}</p>
                    <p class="text-xs text-gray-500">${t.lease || t.type} • ${t.date.toLocaleDateString()}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-sm font-semibold ${t.type === 'Payment' ? 'text-green-600' : 'text-blue-600'}">
                    ₱${t.amount.toLocaleString()}
                </p>
            </div>
        </div>
    `).join('');
}

// Modal control functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
        
        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Reset payment modal steps if closing payment modal
        if (modalId === 'addPaymentModal') {
            const paymentStep1 = document.getElementById('paymentStep1');
            const paymentStep2 = document.getElementById('paymentStep2');
            const paymentNextBtn = document.getElementById('paymentNextBtn');
            const paymentBackBtn = document.getElementById('paymentBackBtn');
            const paymentSubmitBtn = document.getElementById('paymentSubmitBtn');
            const paymentStep2Indicator = document.getElementById('paymentStep2Indicator');
            
            if (paymentStep1) paymentStep1.classList.remove('hidden');
            if (paymentStep2) paymentStep2.classList.add('hidden');
            if (paymentNextBtn) paymentNextBtn.classList.remove('hidden');
            if (paymentBackBtn) paymentBackBtn.classList.add('hidden');
            if (paymentSubmitBtn) paymentSubmitBtn.classList.add('hidden');
            
            if (paymentStep2Indicator) {
                paymentStep2Indicator.classList.add('text-gray-400');
                paymentStep2Indicator.classList.remove('text-green-600');
                const indicatorCircle = paymentStep2Indicator.querySelector('div');
                if (indicatorCircle) {
                    indicatorCircle.classList.add('border-gray-300');
                    indicatorCircle.classList.remove('border-green-600');
                }
            }
        }
    }
}

function openModal(modalId) {
    console.log('Opening modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        console.log('Modal found, displaying...');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';  // Force display: flex
        console.log('✅ Modal should now be visible');
    } else {
        console.error('Modal not found:', modalId);
    }
}

// Initialize modal close buttons
function initializeModalControls() {
    // Payment Modal Step Navigation
    const paymentNextBtn = document.getElementById('paymentNextBtn');
    const paymentBackBtn = document.getElementById('paymentBackBtn');
    const paymentStep1 = document.getElementById('paymentStep1');
    const paymentStep2 = document.getElementById('paymentStep2');
    const paymentSubmitBtn = document.getElementById('paymentSubmitBtn');
    const paymentStep2Indicator = document.getElementById('paymentStep2Indicator');
    
    if (paymentNextBtn && paymentBackBtn && paymentStep1 && paymentStep2) {
        paymentNextBtn.addEventListener('click', () => {
            // Validate step 1 fields
            const lease = document.getElementById('paymentLease').value;
            const amount = document.getElementById('paymentAmount').value;
            
            if (!lease || !amount) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Missing Information',
                    text: 'Please select a lease and enter the payment amount',
                    confirmButtonColor: '#10b981'
                });
                return;
            }
            
            // Update review summary
            const leaseText = document.getElementById('paymentLease').selectedOptions[0].text;
            const method = document.querySelector('input[name="paymentMethod"]:checked').value;
            const methodText = method === 'cash' ? 'Cash Payment' : method.toUpperCase();
            
            document.getElementById('reviewLease').textContent = leaseText;
            document.getElementById('reviewMethod').textContent = methodText;
            document.getElementById('reviewAmount').textContent = '₱' + parseFloat(amount).toLocaleString();
            
            // Show step 2
            paymentStep1.classList.add('hidden');
            paymentStep2.classList.remove('hidden');
            paymentNextBtn.classList.add('hidden');
            paymentBackBtn.classList.remove('hidden');
            paymentSubmitBtn.classList.remove('hidden');
            
            // Update step indicator
            paymentStep2Indicator.classList.remove('text-gray-400');
            paymentStep2Indicator.classList.add('text-green-600');
            paymentStep2Indicator.querySelector('div').classList.remove('border-gray-300');
            paymentStep2Indicator.querySelector('div').classList.add('border-green-600');
        });
        
        paymentBackBtn.addEventListener('click', () => {
            // Show step 1
            paymentStep1.classList.remove('hidden');
            paymentStep2.classList.add('hidden');
            paymentNextBtn.classList.remove('hidden');
            paymentBackBtn.classList.add('hidden');
            paymentSubmitBtn.classList.add('hidden');
            
            // Update step indicator
            paymentStep2Indicator.classList.add('text-gray-400');
            paymentStep2Indicator.classList.remove('text-green-600');
            paymentStep2Indicator.querySelector('div').classList.add('border-gray-300');
            paymentStep2Indicator.querySelector('div').classList.remove('border-green-600');
        });
    }
    
    // Add Product Modal
    const cancelAddProduct = document.getElementById('cancelAddProduct');
    if (cancelAddProduct) {
        cancelAddProduct.addEventListener('click', () => closeModal('addProductModal'));
    }
    
    // Stock Update Modal
    const cancelStockUpdate = document.getElementById('cancelStockUpdate');
    if (cancelStockUpdate) {
        cancelStockUpdate.addEventListener('click', () => closeModal('stockUpdateModal'));
    }
    
    // Add Room Modal
    const cancelAddRoom = document.getElementById('cancelAddRoom');
    if (cancelAddRoom) {
        cancelAddRoom.addEventListener('click', () => closeModal('addRoomModal'));
    }
    
    // New Booking Modal
    const cancelBooking = document.getElementById('cancelBooking');
    if (cancelBooking) {
        cancelBooking.addEventListener('click', () => closeModal('newBookingModal'));
    }
    
    // Payment Modal
    const cancelPayment = document.getElementById('cancelPayment');
    if (cancelPayment) {
        cancelPayment.addEventListener('click', () => closeModal('addPaymentModal'));
    }
    
    // Credit Modal
    const cancelCredit = document.getElementById('cancelCredit');
    if (cancelCredit) {
        cancelCredit.addEventListener('click', () => closeModal('addCreditModal'));
    }
    
    // Close modals when clicking outside
    const modals = ['addProductModal', 'stockUpdateModal', 'addRoomModal', 'newBookingModal', 'addPaymentModal', 'addCreditModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modalId);
                }
            });
        }
    });
}

// Initialize form handlers
async function initializeFormHandlers() {
    const { supabase } = await import('./config.js');
    
    // Add Product Form
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm && !addProductForm.dataset.bound) {
        addProductForm.dataset.bound = 'true';
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newProduct = {
                name: formData.get('productName'),
                category: formData.get('productCategory'),
                department: formData.get('productDepartment'),
                stock: parseInt(formData.get('productStock')),
                price: parseFloat(formData.get('productPrice')),
                status: 'In Stock'
            };
            
            const { error } = await supabase.from('inventory').insert([newProduct]);
            
            if (error) {
                console.error('❌ Failed to save product:', error.message);
                Swal.fire({
                    icon: 'error',
                    title: 'Error adding product',
                    text: error.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            await loadInventory();
            closeModal('addProductModal');
            
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Product added successfully!',
                showConfirmButton: false,
                timer: 1500,
                background: '#fff',
                color: '#000',
                width: '18rem',
                customClass: {
                    popup: 'rounded-lg shadow border border-gray-200 text-sm'
                }
            });
        });
    }
    
    // Stock Update Form
    const stockUpdateForm = document.getElementById('stockUpdateForm');
    if (stockUpdateForm && !stockUpdateForm.dataset.bound) {
        stockUpdateForm.dataset.bound = 'true';
        stockUpdateForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const quantity = parseInt(document.getElementById('stockQuantity').value);
            const reason = document.getElementById('stockReason').value || 'No reason provided';
            
            if (!selectedProductId || !currentStockAction) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Invalid stock operation',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Get current inventory
            const { data: products, error: fetchError } = await supabase
                .from('inventory')
                .select('*')
                .eq('id', selectedProductId)
                .single();
            
            if (fetchError || !products) {
                console.error('Failed to fetch product:', fetchError);
                return;
            }
            
            const newStock = currentStockAction === 'in' 
                ? products.stock + quantity 
                : products.stock - quantity;
            
            if (newStock < 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Operation',
                    text: 'Cannot remove more stock than available',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Determine new status
            let newStatus = 'In Stock';
            if (newStock === 0) newStatus = 'Out of Stock';
            else if (newStock <= 10) newStatus = 'Low Stock';
            
            // Update stock in database
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ 
                    stock: newStock, 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedProductId);
            
            if (updateError) {
                console.error('Failed to update stock:', updateError);
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: updateError.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Record transaction in stock history
            await recordStockTransaction(
                selectedProductId,
                currentStockAction === 'in' ? 'stock_in' : 'stock_out',
                quantity,
                reason,
                products.stock,
                newStock
            );
            
            await loadInventory();
            await loadStockTransactions();
            
            // Reload dashboard stock history if on dashboard
            if (typeof loadStockHistory !== 'undefined') {
                await loadStockHistory();
            }
            
            closeModal('stockUpdateModal');
            
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: `Stock ${currentStockAction === 'in' ? 'added' : 'removed'} successfully!`,
                showConfirmButton: false,
                timer: 1500,
                background: '#fff',
                color: '#000',
                width: '18rem',
                customClass: {
                    popup: 'rounded-lg shadow border border-gray-200 text-sm'
                }
            });
            
            selectedProductId = null;
            currentStockAction = '';
        });
    }
    
    // Add Room Form
    const addRoomForm = document.getElementById('addRoomForm');
    if (addRoomForm && !addRoomForm.dataset.bound) {
        addRoomForm.dataset.bound = 'true';
        addRoomForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newRoom = {
                name: formData.get('roomName'),
                type: formData.get('roomType'),
                capacity: parseInt(formData.get('roomCapacity')),
                rate: parseFloat(formData.get('roomRate')),
                status: 'Available'
            };
            
            const { error } = await supabase.from('rooms').insert([newRoom]);
            
            if (error) {
                console.error('❌ Failed to save room:', error.message);
                Swal.fire({
                    icon: 'error',
                    title: 'Error adding room',
                    text: error.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            await loadRooms();
            updateRoomDropdown(); // Update dropdown with new room
            closeModal('addRoomModal');
            
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Room added successfully!',
                showConfirmButton: false,
                timer: 1500,
                background: '#fff',
                color: '#000',
                width: '18rem',
                customClass: {
                    popup: 'rounded-lg shadow border border-gray-200 text-sm'
                }
            });
        });
    }
    
    // New Booking/Lease Form
    const newBookingForm = document.getElementById('newBookingForm');
    if (newBookingForm && !newBookingForm.dataset.bound) {
        newBookingForm.dataset.bound = 'true';
        
        // Update rent when room or duration changes
        const bookingRoomSelect = document.getElementById('bookingRoom');
        const bookingDurationInput = document.getElementById('bookingDuration');
        const totalAmountInput = document.getElementById('totalAmount');
        
        if (bookingRoomSelect && totalAmountInput) {
            bookingRoomSelect.addEventListener('change', async function() {
                const roomId = parseInt(this.value);
                if (!roomId) {
                    totalAmountInput.value = '';
                    return;
                }
                
                const { data: room } = await supabase
                    .from('rooms')
                    .select('rate')
                    .eq('id', roomId)
                    .single();
                
                if (room) {
                    totalAmountInput.value = room.rate;
                }
            });
        }
        
        newBookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const roomId = parseInt(formData.get('bookingRoom'));
            const clientName = formData.get('clientName');
            const clientContact = formData.get('clientContact');
            const leaseStart = formData.get('bookingDate');
            const leaseEnd = formData.get('leaseEndDate');
            const duration = parseInt(formData.get('bookingDuration'));
            const monthlyRent = parseFloat(formData.get('totalAmount'));
            const securityDeposit = parseFloat(formData.get('securityDeposit'));
            
            if (!roomId || !clientName || !leaseStart || !leaseEnd || !duration || !monthlyRent) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing Information',
                    text: 'Please fill in all required fields',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Get room details
            const { data: roomData, error: roomFetchError } = await supabase
                .from('rooms')
                .select('name')
                .eq('id', roomId)
                .single();
            
            if (roomFetchError || !roomData) {
                console.error('❌ Failed to fetch room details:', roomFetchError);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Could not find room details',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Create new booking
            const newBooking = {
                room_id: roomId,
                room_name: roomData.name,
                tenant: clientName,
                client_name: clientName,
                contact: clientContact,
                client_contact: clientContact,
                start_date: leaseStart,
                lease_start: leaseStart,
                end_date: leaseEnd,
                lease_end: leaseEnd,
                rent: monthlyRent,
                duration: duration,
                duration_months: duration,
                monthly_rent: monthlyRent,
                security_deposit: securityDeposit,
                status: 'Active',
                total_paid: 0,
                balance: monthlyRent * duration
            };
            
            const { error: bookingError } = await supabase
                .from('bookings')
                .insert([newBooking]);
            
            if (bookingError) {
                console.error('❌ Failed to create booking:', bookingError.message);
                Swal.fire({
                    icon: 'error',
                    title: 'Error creating lease',
                    text: bookingError.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Update room status to Occupied
            const { error: roomError } = await supabase
                .from('rooms')
                .update({ 
                    status: 'Occupied',
                    updated_at: new Date().toISOString()
                })
                .eq('id', roomId);
            
            if (roomError) {
                console.error('❌ Failed to update room status:', roomError.message);
            }
            
            await loadRooms();
            await loadBookings();
            closeModal('newBookingModal');
            
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Lease created successfully!',
                showConfirmButton: false,
                timer: 1500,
                background: '#fff',
                color: '#000',
                width: '18rem',
                customClass: {
                    popup: 'rounded-lg shadow border border-gray-200 text-sm'
                }
            });
        });
    }
    
    // Add Payment Form
    const addPaymentForm = document.getElementById('addPaymentForm');
    if (addPaymentForm && !addPaymentForm.dataset.bound) {
        addPaymentForm.dataset.bound = 'true';
        addPaymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const leaseId = parseInt(document.getElementById('paymentLease').value);
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            const receiptNumber = document.getElementById('paymentReceiptNumber').value;
            const notes = document.getElementById('paymentNote').value;
            
            if (!leaseId || !amount || amount <= 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Input',
                    text: 'Please select a lease and enter a valid amount',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Get the booking details
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', leaseId)
                .single();
            
            if (fetchError || !booking) {
                console.error('Failed to fetch booking:', fetchError);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Could not find the selected lease',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Create payment record
            const paymentRecord = {
                booking_id: leaseId,
                amount: amount,
                payment_method: paymentMethod,
                receipt_number: receiptNumber || null,
                notes: notes || null,
                payment_date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString()
            };
            
            // Insert payment record (you may need to create a payments table)
            const { error: paymentError } = await supabase
                .from('payments')
                .insert([paymentRecord]);
            
            if (paymentError) {
                console.error('Failed to record payment:', paymentError);
                // If payments table doesn't exist, just update the booking
                console.log('Updating booking total_paid instead...');
            }
            
            // Update booking's total_paid and balance
            const newTotalPaid = (booking.total_paid || 0) + amount;
            const newBalance = (booking.balance || 0) - amount;
            
            const { error: updateError } = await supabase
                .from('bookings')
                .update({ 
                    total_paid: newTotalPaid,
                    balance: newBalance < 0 ? 0 : newBalance,
                    updated_at: new Date().toISOString()
                })
                .eq('id', leaseId);
            
            if (updateError) {
                console.error('Failed to update booking:', updateError);
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: updateError.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            await loadBookings();
            closeModal('addPaymentModal');
            
            Swal.fire({
                icon: 'success',
                title: 'Payment Recorded!',
                html: `
                    <div class="text-left">
                        <p class="mb-2"><strong>Amount:</strong> ₱${amount.toLocaleString()}</p>
                        <p class="mb-2"><strong>Method:</strong> ${paymentMethod === 'cash' ? 'Cash' : paymentMethod.toUpperCase()}</p>
                        ${receiptNumber ? `<p class="mb-2"><strong>Receipt:</strong> ${receiptNumber}</p>` : ''}
                        <p class="mt-4 text-sm text-gray-600">Remember to issue an official receipt to the tenant.</p>
                    </div>
                `,
                confirmButtonColor: '#10b981',
                confirmButtonText: 'Done'
            });
        });
    }
    
    // Add Credit Form - BULLETPROOF ATTACHMENT
    const attachAddCreditForm = () => {
        const addCreditForm = document.getElementById('addCreditForm');
        console.log('🔍 Looking for addCreditForm:', addCreditForm);
        
        if (addCreditForm && !addCreditForm.dataset.bound) {
            console.log('✅ Attaching Add Credit form handler');
            addCreditForm.dataset.bound = 'true';
            
            // Add Credit Form Submit Handler
            addCreditForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('🚀 Add Credit form submitted!');
                
                const submitBtn = document.getElementById('submitCreditBtn');
                let originalHTML = '';
                
                try {
                    // Show loading state
                    if (submitBtn) {
                        originalHTML = submitBtn.innerHTML;
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = `
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        `;
                    }
                    
                    // Import supabase
                    const { supabase } = await import('./config.js');
                    console.log('✅ Supabase imported');
                    
                    // Get form values
                    const leaseId = parseInt(document.getElementById('creditLease')?.value || '0');
                    const amount = parseFloat(document.getElementById('creditAmount')?.value || '0');
                    const reason = document.getElementById('creditReason')?.value || '';
                    const notes = document.getElementById('creditNote')?.value || '';
                    const reference = document.getElementById('creditReference')?.value || '';
                    
                    console.log('📋 Form values:', { leaseId, amount, reason, notes, reference });
                    
                    // Validate required fields
                    if (!leaseId || leaseId <= 0) {
                        throw new Error('Please select a valid lease');
                    }
                    if (!amount || amount <= 0) {
                        throw new Error('Please enter a valid credit amount');
                    }
                    if (!reason.trim()) {
                        throw new Error('Please select a credit reason');
                    }
                    if (!notes.trim()) {
                        throw new Error('Please enter a description');
                    }
                    
                    console.log('✅ Validation passed');
                    
                    // Get the booking details
                    console.log('📋 Fetching booking details for lease:', leaseId);
                    const { data: booking, error: fetchError } = await supabase
                        .from('bookings')
                        .select('*')
                        .eq('id', leaseId)
                        .single();
                    
                    if (fetchError) {
                        console.error('❌ Failed to fetch booking:', fetchError);
                        throw new Error('Could not find the selected lease: ' + fetchError.message);
                    }
                    
                    if (!booking) {
                        throw new Error('Lease not found');
                    }
                    
                    console.log('✅ Booking found:', booking);
                    
                    // Create credit record
                    const creditRecord = {
                        lease_id: leaseId,
                        amount: amount,
                        reason: reason,
                        notes: notes,
                        reference_number: reference?.trim() || null,
                        credit_date: new Date().toISOString().split('T')[0],
                        created_at: new Date().toISOString()
                    };
                    
                    console.log('💾 Creating credit record:', creditRecord);
                    
                    // Insert credit record
                    const { data: creditResult, error: creditError } = await supabase
                        .from('credits')
                        .insert([creditRecord])
                        .select();
                    
                    if (creditError) {
                        console.error('❌ Failed to record credit:', creditError);
                        throw new Error('Failed to record credit: ' + creditError.message);
                    }
                    
                    console.log('✅ Credit recorded successfully:', creditResult);
                    
                    // Update booking's balance (add credit amount - credits increase balance)
                    const currentBalance = parseFloat(booking.balance) || 0;
                    const newBalance = currentBalance + amount;
                    console.log('💰 Balance update: current', currentBalance, '+ credit', amount, '= new', newBalance);
                
                    
                    // Update booking's balance
                    console.log('📊 Updating booking balance from', currentBalance, 'to', newBalance);
                    const { error: updateError } = await supabase
                        .from('bookings')
                        .update({ 
                            balance: newBalance,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', leaseId);
                    
                    if (updateError) {
                        console.error('❌ Failed to update booking:', updateError);
                        throw new Error('Failed to update booking balance: ' + updateError.message);
                    }
                    
                    console.log('✅ Credit added successfully - reloading data...');
                    
                    // Show success message
                    await Swal.fire({
                        icon: 'success',
                        title: 'Credit Added Successfully!',
                        html: `
                            <div class="text-left space-y-2 bg-green-50 border border-green-200 rounded-lg p-4">
                                <div class="flex items-center mb-3">
                                    <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span class="font-semibold text-green-900">Credit Successfully Applied</span>
                                </div>
                                <p><strong>Tenant:</strong> ${booking.tenant || booking.client_name || 'N/A'}</p>
                                <p><strong>Room:</strong> ${booking.room_name || 'N/A'}</p>
                                <p><strong>Credit Amount:</strong> <span class="text-green-600 font-bold">₱${amount.toLocaleString()}</span></p>
                                <p><strong>Reason:</strong> ${reason.charAt(0).toUpperCase() + reason.slice(1)}</p>
                                ${reference ? `<p><strong>Reference:</strong> ${reference}</p>` : ''}
                                <p><strong>Previous Balance:</strong> ₱${currentBalance.toLocaleString()}</p>
                                <p><strong>New Balance:</strong> <span class="text-blue-600 font-bold">₱${newBalance.toLocaleString()}</span></p>
                                <p class="mt-3 text-sm text-gray-700 italic">"${notes}"</p>
                            </div>
                        `,
                        confirmButtonColor: '#3b82f6',
                        confirmButtonText: 'Continue',
                        timer: 8000,
                        showCloseButton: true
                    });
                    
                    // Reset form and close modal
                    this.reset();
                    closeModal('addCreditModal');
                    
                    // Reload all relevant data
                    console.log('🔄 Refreshing all data...');
                    await Promise.all([
                        loadBookings(),
                        loadRooms()
                    ]);
                    
                    // Check current page and reload its data
                    const currentSection = document.querySelector('[id$="Section"]:not(.hidden)');
                    if (currentSection) {
                        const sectionId = currentSection.id;
                        console.log('🔄 Current section:', sectionId);
                        
                        if (sectionId === 'dashboardSection' && typeof loadDashboardData === 'function') {
                            await loadDashboardData();
                        } else if (sectionId.includes('accounting') && typeof loadAccountingData === 'function') {
                            await loadAccountingData();
                        } else if (sectionId.includes('payment') && typeof loadPaymentSummaryData === 'function') {
                            await loadPaymentSummaryData();
                        }
                    }
                    
                    console.log('✅ All data reloaded successfully!');
                    
                } catch (error) {
                    console.error('❌ Error adding credit:', error);
                    
                    await Swal.fire({
                        icon: 'error',
                        title: 'Credit Addition Failed',
                        text: error.message || 'An unexpected error occurred while adding credit',
                        confirmButtonColor: '#ef4444',
                        confirmButtonText: 'Try Again'
                    });
                } finally {
                    // Always reset button state
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        if (originalHTML) {
                            submitBtn.innerHTML = originalHTML;
                        } else {
                            submitBtn.innerHTML = `
                                <span class="flex items-center">
                                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                    Add Credit
                                </span>
                            `;
                        }
                    }
                }
            });
        } else {
            console.warn('⚠️ Add Credit form not found or already bound');
            return false;
        }
        return true;
    };
    
    // Try to attach form handler immediately and with retries
    if (!attachAddCreditForm()) {
        console.log('🔄 Form not ready, trying again in 1 second...');
        setTimeout(() => {
            if (!attachAddCreditForm()) {
                console.log('🔄 Form still not ready, final attempt in 3 seconds...');
                setTimeout(attachAddCreditForm, 3000);
            }
        }, 1000);
    }
}

// Helper function to generate receipt number
function generateReceiptNumber() {
    const receiptInput = document.getElementById('paymentReceiptNumber');
    if (!receiptInput) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Format: OR-YYYYMMDD-HHMMSS-RRR
    const receiptNumber = `OR-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
    receiptInput.value = receiptNumber;
}

// Helper function to populate lease dropdown
async function populateLeaseDropdown(selectId) {
    try {
        const select = document.getElementById(selectId);
        if (!select) {
            console.error('❌ Select element not found:', selectId);
            return;
        }
        
        console.log('📂 Fetching fresh bookings data for dropdown:', selectId);
        const { supabase } = await import('./config.js');
        
        select.innerHTML = '<option value="">Loading leases...</option>';
        
        // Fetch active bookings directly from database for fresh data
        const { data: activeBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('status', 'Active')
            .order('id', { ascending: true });
        
        if (fetchError) {
            throw fetchError;
        }
        
        console.log('📊 Fresh active bookings fetched:', activeBookings?.length || 0);
        
        select.innerHTML = '<option value="">Select a lease</option>';
        
        if (!activeBookings || activeBookings.length === 0) {
            console.warn('⚠️ No active leases available');
            select.innerHTML = '<option value="">No active leases available</option>';
            return;
        }
        
        activeBookings.forEach(booking => {
            const option = document.createElement('option');
            option.value = booking.id;
            option.textContent = `Lease #${booking.id} - ${booking.client_name || booking.tenant || 'Unknown Tenant'} (Balance: ₱${(booking.balance || 0).toLocaleString()})`;
            option.dataset.bookingData = JSON.stringify(booking);
            select.appendChild(option);
        });
        
        console.log('✅ Dropdown populated with', activeBookings.length, 'leases');
    } catch (error) {
        console.error('❌ Error populating lease dropdown:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error Loading Leases',
            text: 'Failed to load active leases: ' + error.message,
            confirmButtonColor: '#3b82f6'
        });
    }
}

// Initialize Quick Actions in sidebar
function initializeQuickActions() {
    // Quick Add Product button
    const quickAddProduct = document.getElementById('quickAddProduct');
    if (quickAddProduct) {
        quickAddProduct.addEventListener('click', () => {
            const modal = document.getElementById('addProductModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    // Quick Add Room button
    const quickAddRoom = document.getElementById('quickAddRoom');
    if (quickAddRoom) {
        quickAddRoom.addEventListener('click', () => {
            const modal = document.getElementById('addRoomModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    // Quick New Lease button
    const quickNewLease = document.getElementById('quickNewLease');
    if (quickNewLease) {
        quickNewLease.addEventListener('click', async () => {
            // Load rooms first to populate dropdown
            await loadRooms();
            updateRoomDropdown(); // Ensure dropdown is updated
            
            const modal = document.getElementById('newBookingModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
}

// Add global form submission listener for bulletproof Add Credit
function initializeGlobalFormListener() {
    console.log('Setting up global form listener for Add Credit...');
    
    document.addEventListener('submit', async (e) => {
        const form = e.target;
        if (!form.id || form.id !== 'addCreditForm') {
            return; // Not our form
        }
        
        console.log('Global Add Credit form handler triggered');
        e.preventDefault();
        
        // Call the same handler function
        try {
            await handleAddCreditSubmission(form);
        } catch (error) {
            console.error('Global Add Credit handler error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Failed to add credit: ${error.message}`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    });
}

// Logout function
async function initializeLogout() {
    const { supabase } = await import('./config.js');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            // Confirm logout
            const result = await Swal.fire({
                title: 'Logout',
                text: 'Are you sure you want to logout?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#eab308',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, logout',
                cancelButtonText: 'Cancel'
            });
            
            if (result.isConfirmed) {
                // Sign out from Supabase
                const { error } = await supabase.auth.signOut();
                
                if (error) {
                    console.error('Logout error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Logout Failed',
                        text: error.message,
                        confirmButtonColor: '#eab308'
                    });
                    return;
                }
                
                // Clear all localStorage data
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userId');
                localStorage.removeItem('userFullName');
                localStorage.removeItem('userOfficeUnit');
                localStorage.removeItem('isLoggedIn');
                
                // Show success message and redirect
                Swal.fire({
                    icon: 'success',
                    title: 'Logged Out',
                    text: 'You have been successfully logged out.',
                    timer: 1500,
                    showConfirmButton: false,
                    didClose: () => {
                        window.location.href = 'Log In.html';
                    }
                });
            }
        });
    }
}

// Initialize application
async function initApp() {
    try {
        // Load components
        await loadComponent('components/sidebar.html', 'sidebar');
        await loadComponent('components/header.html', 'header');
        await loadComponent('components/modals.html', 'modals');
        
        // Initialize modal controls after modals are loaded
        initializeModalControls();
        
        // Initialize form handlers
        await initializeFormHandlers();
        
        // Initialize Quick Actions in sidebar
        initializeQuickActions();
        
        // Initialize global form listener for bulletproof Add Credit
        initializeGlobalFormListener();
        
        // Initialize logout button
        await initializeLogout();
        
        // Load default page (dashboard)
        await loadPage('pages/dashboard.html', 'mainContent');
        
        // Initialize navigation
        initializeNavigation();
        
        // Initialize dashboard
        window.initDashboardPage();
        
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing application:', error);
    }
}

// Developer utility: Clear test rooms (Call from console: clearTestRooms())
window.clearTestRooms = async function() {
    try {
        const { supabase } = await import('./config.js');
        
        // Confirm action
        const result = await Swal.fire({
            title: 'Clear Test Rooms?',
            text: 'This will delete Room 1, Room 2, and Room 3 from Supabase',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, clear them',
            cancelButtonText: 'Cancel'
        });
        
        if (!result.isConfirmed) return;
        
        // Delete rooms with names "Room 1", "Room 2", "Room 3"
        const { data: deletedRooms, error } = await supabase
            .from('rooms')
            .delete()
            .in('name', ['Room 1', 'Room 2', 'Room 3'])
            .select();
        
        if (error) {
            console.error('Error deleting test rooms:', error);
            Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: error.message,
                confirmButtonColor: '#eab308'
            });
            return;
        }
        
        console.log('Deleted rooms:', deletedRooms);
        
        Swal.fire({
            icon: 'success',
            title: 'Test Rooms Cleared!',
            text: `Deleted ${deletedRooms?.length || 0} rooms`,
            confirmButtonColor: '#10b981'
        });
        
        // Reload rooms if on rooms page
        if (typeof loadRooms === 'function') {
            await loadRooms();
        }
        
    } catch (err) {
        console.error('Unexpected error:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to clear test rooms',
            confirmButtonColor: '#eab308'
        });
    }
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
