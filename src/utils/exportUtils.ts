// Export utilities for CSV/Excel downloads

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; header: string }[]
) {
  if (data.length === 0) {
    return;
  }

  const headers = columns.map(c => c.header).join(',');
  const rows = data
    .map(item =>
      columns
        .map(col => {
          const value = item[col.key] as unknown;
          // Handle strings with commas, quotes, and newlines
          if (typeof value === 'string') {
            const escaped = (value as string).replace(/"/g, '""');
            return `"${escaped}"`;
          }
          return (value ?? '') as string | number;
        })
        .join(',')
    )
    .join('\n');

  const csv = `${headers}\n${rows}`;
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; header: string }[]
) {
  if (data.length === 0) {
    return;
  }

  // Create a simple HTML table that Excel can open
  const headers = columns.map(c => `<th>${c.header}</th>`).join('');
  const rows = data
    .map(item =>
      `<tr>${columns
        .map(col => {
          const value = item[col.key] as unknown;
          return `<td>${value ?? ''}</td>`;
        })
        .join('')}</tr>`
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"></head>
    <body>
      <table border="1">
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>
  `;

  downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Export configurations for common entities
export const docketExportColumns = [
  { key: 'docketNumber' as const, header: 'Docket Number' },
  { key: 'customerName' as const, header: 'Customer' },
  { key: 'consigneeName' as const, header: 'Consignee' },
  { key: 'consigneePhone' as const, header: 'Consignee Phone' },
  { key: 'consigneeAddress' as const, header: 'Consignee Address' },
  { key: 'originOffice' as const, header: 'Origin' },
  { key: 'destinationOffice' as const, header: 'Destination' },
  { key: 'pieces' as const, header: 'Pieces' },
  { key: 'weight' as const, header: 'Weight (kg)' },
  { key: 'chargeableWeight' as const, header: 'Chargeable Weight' },
  { key: 'serviceType' as const, header: 'Service Type' },
  { key: 'paymentMode' as const, header: 'Payment Mode' },
  { key: 'totalAmount' as const, header: 'Amount' },
  { key: 'status' as const, header: 'Status' },
  { key: 'createdAt' as const, header: 'Booked On' },
];

export const invoiceExportColumns = [
  { key: 'invoiceNumber' as const, header: 'Invoice Number' },
  { key: 'customerName' as const, header: 'Customer' },
  { key: 'type' as const, header: 'Type' },
  { key: 'subtotal' as const, header: 'Subtotal' },
  { key: 'taxTotal' as const, header: 'Tax' },
  { key: 'discount' as const, header: 'Discount' },
  { key: 'totalAmount' as const, header: 'Total Amount' },
  { key: 'paidAmount' as const, header: 'Paid Amount' },
  { key: 'balanceAmount' as const, header: 'Balance' },
  { key: 'dueDate' as const, header: 'Due Date' },
  { key: 'status' as const, header: 'Status' },
  { key: 'createdAt' as const, header: 'Created On' },
];

export const manifestExportColumns = [
  { key: 'manifestNumber' as const, header: 'Manifest Number' },
  { key: 'type' as const, header: 'Type' },
  { key: 'originOffice' as const, header: 'Origin' },
  { key: 'destinationOffice' as const, header: 'Destination' },
  { key: 'vehicleNumber' as const, header: 'Vehicle' },
  { key: 'driverName' as const, header: 'Driver' },
  { key: 'docketCount' as const, header: 'Docket Count' },
  { key: 'totalPieces' as const, header: 'Total Pieces' },
  { key: 'totalWeight' as const, header: 'Total Weight' },
  { key: 'dispatchDate' as const, header: 'Dispatch Date' },
  { key: 'status' as const, header: 'Status' },
];

export const truckRunSheetExportColumns = [
  { key: 'drsNumber' as const, header: 'DRS Number' },
  { key: 'date' as const, header: 'Date' },
  { key: 'driverName' as const, header: 'Driver Name' },
  { key: 'vehicleNumber' as const, header: 'Vehicle Number' },
  { key: 'officeName' as const, header: 'Office' },
  { key: 'totalDockets' as const, header: 'Total Dockets' },
  { key: 'deliveredCount' as const, header: 'Delivered' },
  { key: 'pendingCount' as const, header: 'Pending' },
  { key: 'returnedCount' as const, header: 'Returned' },
  { key: 'status' as const, header: 'Status' },
];

export const customerExportColumns = [
  { key: 'code' as const, header: 'Customer Code' },
  { key: 'name' as const, header: 'Name' },
  { key: 'email' as const, header: 'Email' },
  { key: 'phone' as const, header: 'Phone' },
  { key: 'contactPerson' as const, header: 'Contact Person' },
  { key: 'city' as const, header: 'City' },
  { key: 'state' as const, header: 'State' },
  { key: 'gstNumber' as const, header: 'GST Number' },
  { key: 'creditLimit' as const, header: 'Credit Limit' },
  { key: 'status' as const, header: 'Status' },
];

export const pickupExportColumns = [
  { key: 'pickupNumber' as const, header: 'Pickup Number' },
  { key: 'customerName' as const, header: 'Customer' },
  { key: 'pickupDate' as const, header: 'Pickup Date' },
  { key: 'pickupTime' as const, header: 'Pickup Time' },
  { key: 'address' as const, header: 'Address' },
  { key: 'city' as const, header: 'City' },
  { key: 'contactPerson' as const, header: 'Contact Person' },
  { key: 'expectedPieces' as const, header: 'Expected Pieces' },
  { key: 'expectedWeight' as const, header: 'Expected Weight' },
  { key: 'vehicleType' as const, header: 'Vehicle Type' },
  { key: 'status' as const, header: 'Status' },
];
