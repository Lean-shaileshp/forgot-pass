// Core entity types for the Logistics Management System

export interface Customer {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  contactPerson: string;
  creditLimit: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Office {
  id: string;
  code: string;
  name: string;
  type: 'hub' | 'branch' | 'franchise';
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Pickup {
  id: string;
  pickupNumber: string;
  customerId: string;
  customerName: string;
  pickupDate: string;
  pickupTime: string;
  address: string;
  city: string;
  contactPerson: string;
  contactPhone: string;
  expectedPieces: number;
  expectedWeight: number;
  vehicleType: 'bike' | 'van' | 'truck';
  assignedTo?: string;
  assignedToName?: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'completed' | 'cancelled';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Docket {
  id: string;
  docketNumber: string;
  pickupId?: string;
  customerId: string;
  customerName: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeAddress: string;
  originOffice: string;
  destinationOffice: string;
  pieces: number;
  weight: number;
  volumetricWeight?: number;
  chargeableWeight: number;
  serviceType: 'express' | 'standard' | 'economy';
  paymentMode: 'prepaid' | 'topay' | 'credit';
  declaredValue?: number;
  codAmount?: number;
  freight: number;
  otherCharges: number;
  totalAmount: number;
  status: 'booked' | 'in_transit' | 'at_hub' | 'out_for_delivery' | 'delivered' | 'returned';
  currentLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface Manifest {
  id: string;
  manifestNumber: string;
  type: 'outbound' | 'inbound';
  originOffice: string;
  destinationOffice: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  docketIds: string[];
  docketCount: number;
  totalPieces: number;
  totalWeight: number;
  dispatchDate: string;
  expectedArrival?: string;
  actualArrival?: string;
  status: 'created' | 'dispatched' | 'in_transit' | 'arrived' | 'closed';
  createdBy: string;
  createdAt: string;
}

export interface Inscan {
  id: string;
  inscanNumber: string;
  manifestId: string;
  manifestNumber: string;
  officeId: string;
  officeName: string;
  receivedBy: string;
  receivedAt: string;
  expectedDockets: number;
  scannedDockets: number;
  shortDockets: string[];
  damagedDockets: string[];
  status: 'in_progress' | 'completed' | 'discrepancy';
  remarks?: string;
}

export interface DeliveryRunSheet {
  id: string;
  drsNumber: string;
  date: string;
  driverId: string;
  driverName: string;
  vehicleNumber?: string;
  officeId: string;
  officeName: string;
  docketIds: string[];
  totalDockets: number;
  deliveredCount: number;
  pendingCount: number;
  returnedCount: number;
  status: 'created' | 'dispatched' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface POD {
  id: string;
  docketId: string;
  docketNumber: string;
  drsId: string;
  deliveredTo: string;
  relationship: string;
  deliveryDate: string;
  deliveryTime: string;
  signatureUrl?: string;
  photoUrl?: string;
  otp?: string;
  otpVerified: boolean;
  remarks?: string;
  status: 'pending' | 'delivered' | 'partial' | 'returned';
  returnReason?: string;
  createdAt: string;
}

// Inventory & Procurement Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  uom: string;
  hsnCode?: string;
  price: number;
  costPrice: number;
  reorderPoint: number;
  reorderQty: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  rating: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: 'main' | 'regional' | 'transit';
  address: string;
  city: string;
  state: string;
  pincode: string;
  capacity: number;
  usedCapacity: number;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface StockLevel {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  lastUpdated: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  totalAmount: number;
  expectedDate: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'received' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GRNItem {
  productId: string;
  productName: string;
  productSku: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectionReason?: string;
}

export interface GRN {
  id: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  items: GRNItem[];
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceAmount?: number;
  receivedBy: string;
  receivedAt: string;
  remarks?: string;
  status: 'draft' | 'completed' | 'discrepancy';
  createdAt: string;
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  items: SalesOrderItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  totalAmount: number;
  shippingAddress: string;
  expectedDate: string;
  status: 'draft' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'freight' | 'sales' | 'service';
  customerId: string;
  customerName: string;
  referenceId?: string;
  referenceType?: 'docket' | 'sales_order';
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'office_staff' | 'driver' | 'customer';
  officeId?: string;
  officeName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  timestamp: string;
}

// Report Types
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  officeId?: string;
  customerId?: string;
  status?: string;
}
