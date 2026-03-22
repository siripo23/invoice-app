// Supabase-backed Invoice DB
class InvoiceDB {

    _sb() { return window._supabase; }
    _uid() { return window._currentUser ? window._currentUser.id : null; }

    async saveInvoice(invoice) {
        var row = {
            user_id: this._uid(),
            invoice_no: invoice.invoiceNo,
            date: invoice.date,
            customer_address: invoice.customerAddress,
            party_gstin: invoice.partyGSTIN || '',
            products: invoice.products,
            subtotal: invoice.subtotal,
            cgst: invoice.cgst,
            sgst: invoice.sgst,
            grand_total: invoice.grandTotal,
            payment_status: invoice.paymentStatus || 'unpaid',
            created_at: invoice.createdAt || new Date().toISOString()
        };
        var res = await this._sb().from('invoices').insert(row).select().single();
        if (res.error) throw res.error;
        return res.data.id;
    }

    async getAllInvoices() {
        var res = await this._sb()
            .from('invoices')
            .select('*')
            .eq('user_id', this._uid())
            .order('created_at', { ascending: true });
        if (res.error) throw res.error;
        return res.data.map(this._rowToInvoice);
    }

    async searchInvoices(searchTerm) {
        var all = await this.getAllInvoices();
        var term = searchTerm.toLowerCase();
        return all.filter(function(inv) {
            return (inv.invoiceNo || '').toLowerCase().includes(term) ||
                   (inv.customerAddress || '').toLowerCase().includes(term) ||
                   (inv.date || '').includes(term);
        });
    }

    async getLastInvoiceNumber() {
        var all = await this.getAllInvoices();
        if (all.length === 0) return 'SE-0001';
        var last = all[all.length - 1];
        var parts = last.invoiceNo ? last.invoiceNo.split('-') : [];
        var lastNum = parts.length > 1 ? parseInt(parts[parts.length - 1]) : 0;
        var next = isNaN(lastNum) ? 1 : lastNum + 1;
        return 'SE-' + String(next).padStart(4, '0');
    }

    async saveSettings(settings) {
        var res = await this._sb().from('settings').upsert({
            user_id: this._uid(),
            data: settings
        }, { onConflict: 'user_id' });
        if (res.error) throw res.error;
    }

    async loadSettings() {
        var res = await this._sb()
            .from('settings')
            .select('data')
            .eq('user_id', this._uid())
            .maybeSingle();
        if (res.error || !res.data) return {};
        return res.data.data || {};
    }

    _rowToInvoice(row) {
        return {
            _id: row.id,
            invoiceNo: row.invoice_no,
            date: row.date,
            customerAddress: row.customer_address,
            partyGSTIN: row.party_gstin,
            products: row.products,
            subtotal: row.subtotal,
            cgst: row.cgst,
            sgst: row.sgst,
            grandTotal: row.grand_total,
            paymentStatus: row.payment_status,
            createdAt: row.created_at
        };
    }
}

const invoiceDB = new InvoiceDB();

window.addEventListener('userLoggedIn', function() {
    console.log('User logged in, initializing app...');
    window.dispatchEvent(new Event('dbInitialized'));
});
