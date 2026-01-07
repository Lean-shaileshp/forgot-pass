import { Docket, Manifest, Invoice, DeliveryRunSheet } from '@/types';
import { formatDate, formatCurrency } from '@/hooks/useLocalStorage';

// Generic print function that opens a new window with printable content
export function printDocument(title: string, content: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { color: #666; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
        .info-item { padding: 8px; background: #f5f5f5; border-radius: 4px; }
        .info-item label { font-weight: 600; color: #666; display: block; font-size: 10px; text-transform: uppercase; }
        .info-item span { font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .totals { margin-left: auto; width: 250px; }
        .totals .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
        .totals .row.total { font-weight: 700; font-size: 14px; border-top: 2px solid #333; border-bottom: none; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 10px; }
        .signature-box { margin-top: 60px; display: flex; justify-content: space-between; }
        .signature { width: 200px; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
        .barcode { text-align: center; margin: 15px 0; font-family: monospace; font-size: 18px; letter-spacing: 2px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; text-transform: uppercase; font-size: 10px; }
        .status-delivered { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-transit { background: #cce5ff; color: #004085; }
        @media print { body { padding: 0; } @page { margin: 15mm; } }
      </style>
    </head>
    <body>
      ${content}
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Print Docket
export function printDocket(docket: Docket) {
  const statusClass = docket.status === 'delivered' ? 'status-delivered' : 
                      docket.status === 'in_transit' ? 'status-transit' : 'status-pending';
  
  const content = `
    <div class="header">
      <h1>LogiFlow Logistics</h1>
      <p>Consignment Note / Docket</p>
    </div>
    
    <div class="barcode">${docket.docketNumber}</div>
    
    <div class="info-grid">
      <div class="info-item">
        <label>Docket Number</label>
        <span>${docket.docketNumber}</span>
      </div>
      <div class="info-item">
        <label>Status</label>
        <span class="status ${statusClass}">${docket.status.replace('_', ' ')}</span>
      </div>
      <div class="info-item">
        <label>Booking Date</label>
        <span>${formatDate(docket.createdAt)}</span>
      </div>
      <div class="info-item">
        <label>Service Type</label>
        <span>${docket.serviceType.toUpperCase()}</span>
      </div>
    </div>

    <h3 style="margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Consignor Details</h3>
    <div class="info-grid">
      <div class="info-item">
        <label>Customer</label>
        <span>${docket.customerName}</span>
      </div>
      <div class="info-item">
        <label>Origin Office</label>
        <span>${docket.originOffice}</span>
      </div>
    </div>

    <h3 style="margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Consignee Details</h3>
    <div class="info-grid">
      <div class="info-item">
        <label>Name</label>
        <span>${docket.consigneeName}</span>
      </div>
      <div class="info-item">
        <label>Phone</label>
        <span>${docket.consigneePhone}</span>
      </div>
      <div class="info-item" style="grid-column: span 2;">
        <label>Address</label>
        <span>${docket.consigneeAddress}</span>
      </div>
      <div class="info-item">
        <label>Destination Office</label>
        <span>${docket.destinationOffice}</span>
      </div>
    </div>

    <h3 style="margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Shipment Details</h3>
    <table>
      <thead>
        <tr>
          <th>Pieces</th>
          <th>Actual Weight (kg)</th>
          <th>Chargeable Weight (kg)</th>
          <th>Payment Mode</th>
          ${docket.declaredValue ? '<th>Declared Value</th>' : ''}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${docket.pieces}</td>
          <td>${docket.weight}</td>
          <td>${docket.chargeableWeight}</td>
          <td>${docket.paymentMode.toUpperCase()}</td>
          ${docket.declaredValue ? `<td>${formatCurrency(docket.declaredValue)}</td>` : ''}
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Freight</span><span>${formatCurrency(docket.freight)}</span></div>
      <div class="row"><span>Other Charges</span><span>${formatCurrency(docket.otherCharges)}</span></div>
      <div class="row total"><span>Total Amount</span><span>${formatCurrency(docket.totalAmount)}</span></div>
    </div>

    <div class="signature-box">
      <div class="signature">
        <div class="signature-line">Consignor Signature</div>
      </div>
      <div class="signature">
        <div class="signature-line">Receiver Signature</div>
      </div>
    </div>

    <div class="footer">
      <p>This is a computer-generated document. No signature required for authentication.</p>
      <p>Terms & Conditions apply. Visit www.logiflow.com for details.</p>
    </div>
  `;

  printDocument(`Docket - ${docket.docketNumber}`, content);
}

// Print Manifest
export function printManifest(manifest: Manifest, dockets: Docket[]) {
  const manifestDockets = dockets.filter(d => manifest.docketIds.includes(d.id));
  
  const content = `
    <div class="header">
      <h1>LogiFlow Logistics</h1>
      <p>Manifest / Load Sheet</p>
    </div>
    
    <div class="barcode">${manifest.manifestNumber}</div>
    
    <div class="info-grid">
      <div class="info-item">
        <label>Manifest Number</label>
        <span>${manifest.manifestNumber}</span>
      </div>
      <div class="info-item">
        <label>Type</label>
        <span>${manifest.type.toUpperCase()}</span>
      </div>
      <div class="info-item">
        <label>Origin</label>
        <span>${manifest.originOffice}</span>
      </div>
      <div class="info-item">
        <label>Destination</label>
        <span>${manifest.destinationOffice}</span>
      </div>
      <div class="info-item">
        <label>Vehicle Number</label>
        <span>${manifest.vehicleNumber || '-'}</span>
      </div>
      <div class="info-item">
        <label>Driver</label>
        <span>${manifest.driverName || '-'} ${manifest.driverPhone ? `(${manifest.driverPhone})` : ''}</span>
      </div>
      <div class="info-item">
        <label>Dispatch Date</label>
        <span>${formatDate(manifest.dispatchDate)}</span>
      </div>
      <div class="info-item">
        <label>Expected Arrival</label>
        <span>${manifest.expectedArrival ? formatDate(manifest.expectedArrival) : '-'}</span>
      </div>
    </div>

    <h3 style="margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Docket List</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Docket No.</th>
          <th>Consignee</th>
          <th>Destination</th>
          <th>Pieces</th>
          <th>Weight (kg)</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${manifestDockets.map((d, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${d.docketNumber}</td>
            <td>${d.consigneeName}</td>
            <td>${d.destinationOffice}</td>
            <td>${d.pieces}</td>
            <td>${d.chargeableWeight}</td>
            <td>${formatCurrency(d.totalAmount)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold; background: #f5f5f5;">
          <td colspan="4">Total</td>
          <td>${manifest.totalPieces}</td>
          <td>${manifest.totalWeight}</td>
          <td>${formatCurrency(manifestDockets.reduce((sum, d) => sum + d.totalAmount, 0))}</td>
        </tr>
      </tfoot>
    </table>

    <div class="signature-box">
      <div class="signature">
        <div class="signature-line">Prepared By</div>
      </div>
      <div class="signature">
        <div class="signature-line">Driver Signature</div>
      </div>
      <div class="signature">
        <div class="signature-line">Received By</div>
      </div>
    </div>

    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  `;

  printDocument(`Manifest - ${manifest.manifestNumber}`, content);
}

// Print Invoice
export function printInvoice(invoice: Invoice) {
  const content = `
    <div class="header">
      <h1>LogiFlow Logistics</h1>
      <p>TAX INVOICE</p>
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <label>Invoice Number</label>
        <span>${invoice.invoiceNumber}</span>
      </div>
      <div class="info-item">
        <label>Invoice Date</label>
        <span>${formatDate(invoice.createdAt)}</span>
      </div>
      <div class="info-item">
        <label>Due Date</label>
        <span>${formatDate(invoice.dueDate)}</span>
      </div>
      <div class="info-item">
        <label>Invoice Type</label>
        <span>${invoice.type.toUpperCase()}</span>
      </div>
    </div>

    <h3 style="margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Bill To</h3>
    <div class="info-grid">
      <div class="info-item" style="grid-column: span 2;">
        <label>Customer</label>
        <span>${invoice.customerName}</span>
      </div>
    </div>

    <h3 style="margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Invoice Items</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Tax %</th>
          <th>Tax Amt</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.rate)}</td>
            <td>${item.taxRate}%</td>
            <td>${formatCurrency(item.taxAmount)}</td>
            <td>${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${formatCurrency(invoice.subtotal)}</span></div>
      <div class="row"><span>Tax</span><span>${formatCurrency(invoice.taxTotal)}</span></div>
      ${invoice.discount > 0 ? `<div class="row"><span>Discount</span><span>-${formatCurrency(invoice.discount)}</span></div>` : ''}
      <div class="row total"><span>Total Amount</span><span>${formatCurrency(invoice.totalAmount)}</span></div>
      <div class="row"><span>Paid Amount</span><span>${formatCurrency(invoice.paidAmount)}</span></div>
      <div class="row" style="color: ${invoice.balanceAmount > 0 ? '#dc3545' : '#28a745'};"><span>Balance Due</span><span>${formatCurrency(invoice.balanceAmount)}</span></div>
    </div>

    <div style="margin-top: 40px; padding: 15px; background: #f5f5f5; border-radius: 4px;">
      <h4 style="margin-bottom: 10px;">Bank Details</h4>
      <p>Bank Name: HDFC Bank</p>
      <p>Account Number: 50100123456789</p>
      <p>IFSC Code: HDFC0001234</p>
      <p>Branch: Mumbai Main Branch</p>
    </div>

    <div class="signature-box">
      <div class="signature">
        <div class="signature-line">Authorized Signatory</div>
      </div>
    </div>

    <div class="footer">
      <p>E&OE - Errors and Omissions Excepted</p>
      <p>This is a computer-generated invoice. No signature required.</p>
    </div>
  `;

  printDocument(`Invoice - ${invoice.invoiceNumber}`, content);
}

// Print Truck Run Sheet (System Record)
export function printDeliveryRunSheet(drs: DeliveryRunSheet, dockets: Docket[]) {
  const drsDockets = dockets.filter(d => drs.docketIds.includes(d.id));
  
  const content = `
    <div class="header">
      <h1>LogiFlow Logistics</h1>
      <p>Truck Run Sheet - System Record</p>
    </div>
    
    <div class="barcode">${drs.drsNumber}</div>
    
    <div class="info-grid">
      <div class="info-item">
        <label>TRS Number</label>
        <span>${drs.drsNumber}</span>
      </div>
      <div class="info-item">
        <label>Date</label>
        <span>${formatDate(drs.date)}</span>
      </div>
      <div class="info-item">
        <label>Truck Driver</label>
        <span>${drs.driverName}</span>
      </div>
      <div class="info-item">
        <label>Vehicle Number</label>
        <span>${drs.vehicleNumber || '-'}</span>
      </div>
      <div class="info-item">
        <label>Office</label>
        <span>${drs.officeName}</span>
      </div>
      <div class="info-item">
        <label>Status</label>
        <span class="status">${drs.status.replace('_', ' ').toUpperCase()}</span>
      </div>
    </div>

    <h3 style="margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Delivery Summary</h3>
    <div class="info-grid" style="grid-template-columns: repeat(4, 1fr);">
      <div class="info-item" style="text-align: center;">
        <label>Total</label>
        <span style="font-size: 24px; font-weight: bold;">${drs.totalDockets}</span>
      </div>
      <div class="info-item" style="text-align: center; background: #d4edda;">
        <label>Delivered</label>
        <span style="font-size: 24px; font-weight: bold; color: #155724;">${drs.deliveredCount}</span>
      </div>
      <div class="info-item" style="text-align: center; background: #fff3cd;">
        <label>Pending</label>
        <span style="font-size: 24px; font-weight: bold; color: #856404;">${drs.pendingCount}</span>
      </div>
      <div class="info-item" style="text-align: center; background: #f8d7da;">
        <label>Returned</label>
        <span style="font-size: 24px; font-weight: bold; color: #721c24;">${drs.returnedCount}</span>
      </div>
    </div>

    <h3 style="margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Docket List</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Docket No.</th>
          <th>Consignee</th>
          <th>Address</th>
          <th>Phone</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${drsDockets.map((d, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${d.docketNumber}</td>
            <td>${d.consigneeName}</td>
            <td style="max-width: 150px;">${d.consigneeAddress}</td>
            <td>${d.consigneePhone}</td>
            <td>${formatCurrency(d.totalAmount)}</td>
            <td>${d.status}</td>
            <td style="width: 100px;"></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="signature-box">
      <div class="signature">
        <div class="signature-line">Truck Driver</div>
      </div>
      <div class="signature">
        <div class="signature-line">Supervisor</div>
      </div>
    </div>

    <div class="footer">
      <p>System Record - For Internal Use Only</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  `;

  printDocument(`TRS - ${drs.drsNumber}`, content);
}
