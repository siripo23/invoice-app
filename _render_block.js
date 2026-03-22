function _renderInvoicePreview(modal, preview, settings) {
    var companyName = settings.companyName || '';
    var companyAddress = settings.companyAddress || '';
    var companyGSTIN = settings.companyGSTIN || '';
    var companyMobile = settings.companyMobile || '';
    var bankName = settings.bankName || '';
    var bankBranch = settings.bankBranch || '';
    var accountNumber = settings.accountNumber || '';
    var ifscCode = settings.ifscCode || '';

    // Normalize products
    var products = currentInvoice.products;
    if (typeof products === 'string') { try { products = JSON.parse(products); } catch(e) { products = []; } }
    if (!Array.isArray(products)) products = [];
    currentInvoice.products = products;

    // Normalize numbers
    currentInvoice.subtotal   = parseFloat(currentInvoice.subtotal)   || 0;
    currentInvoice.cgst       = parseFloat(currentInvoice.cgst)       || 0;
    currentInvoice.sgst       = parseFloat(currentInvoice.sgst)       || 0;
    currentInvoice.grandTotal = parseFloat(currentInvoice.grandTotal) || 0;

    var B = 'border:1px solid #000;';

    // Product rows - fixed 10
    var productsHTML = '';
    for (var i = 0; i < 10; i++) {
        var p = currentInvoice.products[i];
        if (p) {
            var pRate = parseFloat(p.rate) || 0;
            var pAmount = parseFloat(p.amount) || 0;
            productsHTML += '<tr>' +
                '<td style="' + B + 'text-align:center;">' + p.slNo + '</td>' +
                '<td style="' + B + 'text-align:left;">' + p.desc + '</td>' +
                '<td style="' + B + 'text-align:center;">' + (p.hsn || '') + '</td>' +
                '<td style="' + B + 'text-align:center;">' + p.gst + '%</td>' +
                '<td style="' + B + 'text-align:center;">' + p.qty + '</td>' +
                '<td style="' + B + 'text-align:right;">' + pRate.toFixed(2) + '</td>' +
                '<td style="' + B + 'text-align:right;">' + pAmount.toFixed(2) + '</td>' +
                '</tr>';
        } else {
            productsHTML += '<tr>' +
                '<td style="' + B + 'height:30px;">&nbsp;</td>' +
                '<td style="' + B + '">&nbsp;</td>' +
                '<td style="' + B + '">&nbsp;</td>' +
                '<td style="' + B + '">&nbsp;</td>' +
                '<td style="' + B + '">&nbsp;</td>' +
                '<td style="' + B + '">&nbsp;</td>' +
                '<td style="' + B + '">&nbsp;</td>' +
                '</tr>';
        }
    }

    // GST breakdown
    var gstBreakdown = {};
    for (var i = 0; i < currentInvoice.products.length; i++) {
        var p = currentInvoice.products[i];
        var rate = p.gst;
        if (!gstBreakdown[rate]) gstBreakdown[rate] = 0;
        gstBreakdown[rate] += parseFloat(p.amount) || 0;
    }
    var cgst5 = 0, cgst12 = 0, cgst18 = 0, sgst5 = 0, sgst12 = 0, sgst18 = 0;
    if (gstBreakdown[5])  { cgst5  = gstBreakdown[5]  * 0.025; sgst5  = cgst5; }
    if (gstBreakdown[12]) { cgst12 = gstBreakdown[12] * 0.06;  sgst12 = cgst12; }
    if (gstBreakdown[18]) { cgst18 = gstBreakdown[18] * 0.09;  sgst18 = cgst18; }
    var totalCGST = cgst5 + cgst12 + cgst18;
    var totalSGST = sgst5 + sgst12 + sgst18;
    var invoiceTotal = currentInvoice.subtotal + totalCGST + totalSGST;
    var amountInWords = numberToWords(invoiceTotal);

    var html =
    '<div id="bill-print" style="width:210mm;background:#fff;color:#000;font-family:Arial,sans-serif;font-size:13px;margin:0 auto;box-sizing:border-box;padding:8mm;">' +
    '<div style="border:2px solid #000;padding:6px;box-sizing:border-box;">' +
    '<style>' +
    '#bill-print table{border-collapse:collapse;width:100%;}' +
    '#bill-print td,#bill-print th{padding:3px 5px;vertical-align:middle;}' +
    '#bill-print .big{font-size:26px;font-weight:bold;letter-spacing:2px;font-family:Georgia,serif;}' +
    '</style>' +

    // GSTIN | MOB
    '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;margin-bottom:2px;">' +
    '<span>GSTIN: ' + companyGSTIN + '</span>' +
    '<span>MOB No: ' + companyMobile + '</span>' +
    '</div>' +

    // TAX INVOICE
    '<div style="text-align:center;font-weight:bold;font-size:15px;letter-spacing:2px;padding:2px 0;">TAX INVOICE</div>' +

    // Logo + Company
    '<div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:2px 0;">' +
    '<img src="' + LOGO_DATA_URL + '" style="width:75px;height:auto;">' +
    '<div style="text-align:center;">' +
    '<div class="big">' + companyName + '</div>' +
    '<div style="font-size:12px;color:#333;margin-top:2px;">' + companyAddress + '</div>' +
    '</div>' +
    '</div>' +

    '<div style="border-top:2px solid #000;margin:4px 0;"></div>' +

    // Name & Address header
    '<table><tr>' +
    '<td style="width:65%;' + B + 'font-weight:bold;">Name &amp; Address:</td>' +
    '<td style="width:35%;' + B + 'font-size:12px;text-align:right;">Email: ' + (settings.companyEmail || '') + '</td>' +
    '</tr></table>' +

    // Customer | Invoice No
    '<table><tr>' +
    '<td style="width:65%;' + B + 'vertical-align:top;padding:4px;">' + currentInvoice.customerAddress.replace(/\n/g,'<br>') + '</td>' +
    '<td style="width:35%;' + B + 'vertical-align:top;">' +
    '<table style="width:100%;height:100%;border-collapse:collapse;">' +
    '<tr><td style="border-bottom:1px solid #000;font-weight:bold;text-align:center;padding:4px;">INVOICE NO:</td></tr>' +
    '<tr><td style="text-align:center;font-weight:bold;font-size:13px;padding:4px;">' + currentInvoice.invoiceNo + '</td></tr>' +
    '</table></td>' +
    '</tr></table>' +

    // Party GSTIN | Date
    '<table><tr>' +
    '<td style="width:65%;' + B + '">Party GSTIN: ' + (currentInvoice.partyGSTIN || '') + '</td>' +
    '<td style="width:35%;' + B + '">Date: ' + formatDate(currentInvoice.date) + '</td>' +
    '</tr></table>' +

    // Product table
    '<table>' +
    '<thead><tr style="background:#f0f0f0;">' +
    '<th style="width:6%;' + B + 'text-align:center;">Sl.No</th>' +
    '<th style="width:32%;' + B + 'text-align:center;">Name of Product / Service</th>' +
    '<th style="width:12%;' + B + 'text-align:center;">HSN/SAN</th>' +
    '<th style="width:10%;' + B + 'text-align:center;">GST RATE</th>' +
    '<th style="width:8%;' + B + 'text-align:center;">QTY</th>' +
    '<th style="width:14%;' + B + 'text-align:center;">RATE</th>' +
    '<th style="width:18%;' + B + 'text-align:center;">AMOUNT</th>' +
    '</tr></thead>' +
    '<tbody>' + productsHTML + '</tbody>' +
    '</table>' +

    // GST breakdown (left 70%) + Summary (right 30%)
    '<table style="width:100%;border-collapse:collapse;"><tr>' +
    '<td style="width:70%;vertical-align:top;padding:0;border:none;">' +
    '<table style="width:100%;border-collapse:collapse;">' +
    '<tr style="background:#f0f0f0;font-weight:bold;">' +
    '<td style="' + B + 'text-align:center;width:14%;">GST%</td>' +
    '<td style="' + B + 'text-align:center;width:22%;">CGST%</td>' +
    '<td style="' + B + 'text-align:right;width:14%;">Amount</td>' +
    '<td style="' + B + 'text-align:center;width:22%;">SGST%</td>' +
    '<td style="' + B + 'text-align:right;width:14%;">Amount</td>' +
    '</tr>' +
    '<tr><td style="' + B + 'text-align:center;">5%</td><td style="' + B + 'text-align:center;">2.5%</td><td style="' + B + 'text-align:right;">' + cgst5.toFixed(2) + '</td><td style="' + B + 'text-align:center;">2.5%</td><td style="' + B + 'text-align:right;">' + sgst5.toFixed(2) + '</td></tr>' +
    '<tr><td style="' + B + 'text-align:center;">12%</td><td style="' + B + 'text-align:center;">6%</td><td style="' + B + 'text-align:right;">' + cgst12.toFixed(2) + '</td><td style="' + B + 'text-align:center;">6%</td><td style="' + B + 'text-align:right;">' + sgst12.toFixed(2) + '</td></tr>' +
    '<tr><td style="' + B + 'text-align:center;">18%</td><td style="' + B + 'text-align:center;">9%</td><td style="' + B + 'text-align:right;">' + cgst18.toFixed(2) + '</td><td style="' + B + 'text-align:center;">9%</td><td style="' + B + 'text-align:right;">' + sgst18.toFixed(2) + '</td></tr>' +
    '<tr style="font-weight:bold;"><td style="' + B + 'text-align:center;">TOTAL</td><td style="' + B + '"></td><td style="' + B + 'text-align:right;">' + totalCGST.toFixed(2) + '</td><td style="' + B + '"></td><td style="' + B + 'text-align:right;">' + totalSGST.toFixed(2) + '</td></tr>' +
    '</table></td>' +
    '<td style="width:30%;vertical-align:top;padding:0;border:none;">' +
    '<table style="width:100%;border-collapse:collapse;">' +
    '<tr style="font-weight:bold;"><td style="' + B + 'padding:3px 6px;">TOTAL</td><td style="' + B + 'text-align:right;padding:3px 6px;">' + currentInvoice.subtotal.toFixed(2) + '</td></tr>' +
    '<tr><td style="' + B + 'padding:3px 6px;">CGST</td><td style="' + B + 'text-align:right;padding:3px 6px;">' + totalCGST.toFixed(2) + '</td></tr>' +
    '<tr><td style="' + B + 'padding:3px 6px;">SGST</td><td style="' + B + 'text-align:right;padding:3px 6px;">' + totalSGST.toFixed(2) + '</td></tr>' +
    '<tr><td style="' + B + 'padding:3px 6px;">Round off()</td><td style="' + B + 'text-align:right;padding:3px 6px;">0.00</td></tr>' +
    '<tr style="font-weight:bold;"><td style="' + B + 'padding:3px 6px;">Invoice Amount</td><td style="' + B + 'text-align:right;padding:3px 6px;">\u20B9' + invoiceTotal.toFixed(2) + '</td></tr>' +
    '</table></td>' +
    '</tr></table>' +

    // Bank details
    '<table>' +
    '<tr><td style="' + B + 'font-size:12px;"><strong>Bank:</strong> ' + companyName + ' &nbsp;|&nbsp; ' + bankName + ', ' + bankBranch + '</td></tr>' +
    '<tr><td style="' + B + 'font-size:12px;"><strong>A/c No:</strong> ' + accountNumber + ' &nbsp;|&nbsp; <strong>IFSC:</strong> ' + ifscCode + '</td></tr>' +
    '</table>' +

    // Rupees in words
    '<table><tr><td style="' + B + 'font-size:12px;"><strong>Rupees in Words:</strong> ' + amountInWords + '</td></tr></table>' +

    // Terms & Signature
    '<table><tr>' +
    '<td style="width:65%;' + B + 'font-size:12px;vertical-align:top;">' +
    '1. Subject to Shimoga Jurisdiction.<br>' +
    '2. We are not responsible for breaking or loss in transport.<br>' +
    '3. Goods once sold cannot be taken back or exchanged.' +
    '</td>' +
    '<td style="width:35%;' + B + 'text-align:center;vertical-align:bottom;padding:8px 4px 6px 4px;">' +
    '<div style="margin-bottom:28px;font-weight:bold;">For ' + companyName + '</div>' +
    '<div style="font-size:12px;">(Authorized Signatory)</div>' +
    '</td>' +
    '</tr></table>' +
    '</div></div>';

    preview.innerHTML = html;
    modal.style.display = 'block';
}
