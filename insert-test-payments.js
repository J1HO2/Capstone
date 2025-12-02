import { SUPABASE_CONFIG } from './config/credentials.js';

const supabase = (() => {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
})();

async function insertTestPayments() {
    try {
        console.log('🔄 Fetching existing bookings...');
        
        // First, fetch an existing booking
        const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('id, tenant, room_name')
            .limit(1);
        
        if (bookingError || !bookings || bookings.length === 0) {
            console.error('❌ No bookings found. Please create a lease first.');
            return;
        }
        
        const booking = bookings[0];
        console.log(`✅ Found booking: ${booking.tenant} in ${booking.room_name}`);
        
        // Insert test payments
        const testPayments = [
            {
                lease_id: booking.id,
                amount: 5000,
                payment_method: 'Cash',
                payment_type: 'Monthly Rent',
                receipt_number: 'RCP-001',
                notes: 'Monthly rent payment',
                payment_date: new Date('2025-12-01').toISOString().split('T')[0]
            },
            {
                lease_id: booking.id,
                amount: 2000,
                payment_method: 'Bank Transfer',
                payment_type: 'Partial Payment',
                receipt_number: 'RCP-002',
                notes: 'Partial payment for November',
                payment_date: new Date('2025-11-25').toISOString().split('T')[0]
            },
            {
                lease_id: booking.id,
                amount: 500,
                payment_method: 'Cash',
                payment_type: 'Deposit',
                receipt_number: 'RCP-003',
                notes: 'Security deposit',
                payment_date: new Date('2025-11-15').toISOString().split('T')[0]
            }
        ];
        
        console.log('💳 Inserting test payments...');
        const { data: payments, error: paymentError } = await supabase
            .from('payments')
            .insert(testPayments)
            .select();
        
        if (paymentError) {
            console.error('❌ Error inserting payments:', paymentError);
            return;
        }
        
        console.log(`✅ Successfully inserted ${payments.length} test payments!`);
        console.log('📊 Payments:', payments);
        
        // Also insert a test credit
        const { data: credit, error: creditError } = await supabase
            .from('credits')
            .insert({
                lease_id: booking.id,
                amount: 1000,
                reason: 'Early payment discount',
                reference: 'CREDIT-001',
                notes: 'Discount for early payment',
                credit_date: new Date('2025-12-02').toISOString().split('T')[0]
            })
            .select();
        
        if (creditError) {
            console.error('❌ Error inserting credit:', creditError);
            return;
        }
        
        console.log('✅ Successfully inserted test credit!');
        console.log('Refresh your browser to see the payments in the Payment & Credit History page');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

insertTestPayments();
