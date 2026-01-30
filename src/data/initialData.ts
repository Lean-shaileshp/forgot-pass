import { Customer, Office, Pickup, Docket, Manifest, Product, Supplier, Warehouse, StockLevel, PurchaseOrder, GRN, SalesOrder, Invoice, User } from '@/types';

export const initialCustomers: Customer[] = [
  {
    id: '1',
    code: 'CUST001',
    name: 'ABC Electronics',
    email: 'contact@abcelectronics.com',
    phone: '9876543210',
    address: '123 MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    gstNumber: '27AABCU9603R1ZM',
    contactPerson: 'Rajesh Kumar',
    creditLimit: 500000,
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    code: 'CUST002',
    name: 'XYZ Pharmaceuticals',
    email: 'orders@xyzpharma.com',
    phone: '9876543211',
    address: '456 Industrial Area',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    gstNumber: '07AABCU9603R1ZN',
    contactPerson: 'Priya Sharma',
    creditLimit: 1000000,
    status: 'active',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z'
  },
  {
    id: '3',
    code: 'CUST003',
    name: 'Global Textiles',
    email: 'shipping@globaltextiles.in',
    phone: '9876543212',
    address: '789 Textile Hub',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395001',
    contactPerson: 'Amit Patel',
    creditLimit: 750000,
    status: 'active',
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z'
  }
];

export const initialOffices: Office[] = [
  {
    id: '1',
    code: 'MUM-HUB',
    name: 'Mumbai Hub',
    type: 'hub',
    address: 'Plot 45, MIDC',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '022-12345678',
    email: 'mumbai@logistics.com',
    managerName: 'Suresh Verma',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    code: 'DEL-HUB',
    name: 'Delhi Hub',
    type: 'hub',
    address: 'Sector 18, Gurgaon',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '011-12345678',
    email: 'delhi@logistics.com',
    managerName: 'Ramesh Singh',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    code: 'BLR-BR',
    name: 'Bangalore Branch',
    type: 'branch',
    address: 'Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560100',
    phone: '080-12345678',
    email: 'bangalore@logistics.com',
    managerName: 'Kiran Rao',
    status: 'active',
    createdAt: '2024-01-02T00:00:00Z'
  }
];

export const initialPickups: Pickup[] = [
  {
    id: '1',
    pickupNumber: 'PU000001',
    customerId: '1',
    customerName: 'ABC Electronics',
    pickupDate: '2024-12-28',
    pickupTime: '10:00',
    address: '123 MG Road, Mumbai',
    city: 'Mumbai',
    contactPerson: 'Rajesh Kumar',
    contactPhone: '9876543210',
    expectedPieces: 5,
    expectedWeight: 25,
    vehicleType: 'van',
    assignedToName: 'Delivery Boy 1',
    status: 'completed',
    createdAt: '2024-12-27T10:00:00Z',
    updatedAt: '2024-12-28T12:00:00Z'
  },
  {
    id: '2',
    pickupNumber: 'PU000002',
    customerId: '2',
    customerName: 'XYZ Pharmaceuticals',
    pickupDate: '2024-12-29',
    pickupTime: '14:00',
    address: '456 Industrial Area, Delhi',
    city: 'Delhi',
    contactPerson: 'Priya Sharma',
    contactPhone: '9876543211',
    expectedPieces: 10,
    expectedWeight: 50,
    vehicleType: 'truck',
    status: 'pending',
    createdAt: '2024-12-28T10:00:00Z',
    updatedAt: '2024-12-28T10:00:00Z'
  }
];

export const initialDockets: Docket[] = [
  {
    id: '1',
    docketNumber: 'DKT000001',
    pickupId: '1',
    customerId: '1',
    customerName: 'ABC Electronics',
    consigneeName: 'Tech Store Delhi',
    consigneePhone: '9876543220',
    consigneeAddress: '789 Karol Bagh, Delhi',
    originOffice: 'Mumbai Hub',
    destinationOffice: 'Delhi Hub',
    pieces: 3,
    weight: 15,
    chargeableWeight: 15,
    serviceType: 'express',
    paymentMode: 'prepaid',
    freight: 1500,
    otherCharges: 100,
    totalAmount: 1600,
    status: 'packed',
    currentLocation: 'Mumbai Hub',
    createdAt: '2024-12-28T12:00:00Z',
    updatedAt: '2024-12-29T08:00:00Z'
  },
  {
    id: '2',
    docketNumber: 'DKT000002',
    customerId: '2',
    customerName: 'XYZ Pharmaceuticals',
    consigneeName: 'City Pharmacy',
    consigneePhone: '9876543221',
    consigneeAddress: '456 Brigade Road, Bangalore',
    originOffice: 'Delhi Hub',
    destinationOffice: 'Bangalore Branch',
    pieces: 5,
    weight: 25,
    chargeableWeight: 30,
    serviceType: 'standard',
    paymentMode: 'topay',
    declaredValue: 50000,
    freight: 2000,
    otherCharges: 200,
    totalAmount: 2200,
    status: 'booked',
    currentLocation: 'Delhi Hub',
    createdAt: '2024-12-29T09:00:00Z',
    updatedAt: '2024-12-29T09:00:00Z'
  },
  {
    id: '3',
    docketNumber: 'DKT000003',
    customerId: '1',
    customerName: 'ABC Electronics',
    consigneeName: 'Metro Electronics',
    consigneePhone: '9876543222',
    consigneeAddress: '321 Connaught Place, Delhi',
    originOffice: 'Mumbai Hub',
    destinationOffice: 'Delhi Hub',
    pieces: 2,
    weight: 10,
    chargeableWeight: 10,
    serviceType: 'express',
    paymentMode: 'prepaid',
    freight: 1000,
    otherCharges: 50,
    totalAmount: 1050,
    status: 'picked',
    currentLocation: 'Mumbai Hub',
    createdAt: '2024-12-30T10:00:00Z',
    updatedAt: '2024-12-30T11:00:00Z'
  }
];

export const initialManifests: Manifest[] = [
  {
    id: '1',
    manifestNumber: 'MAN000001',
    type: 'outbound',
    originOffice: 'Mumbai Hub',
    destinationOffice: 'Delhi Hub',
    vehicleNumber: 'MH01AB1234',
    driverName: 'Raju Driver',
    driverPhone: '9876543230',
    docketIds: ['1'],
    docketCount: 1,
    totalPieces: 3,
    totalWeight: 15,
    dispatchDate: '2024-12-28T18:00:00Z',
    expectedArrival: '2024-12-29T06:00:00Z',
    status: 'in_transit',
    createdBy: 'Admin',
    createdAt: '2024-12-28T17:00:00Z'
  }
];

export const initialProducts: Product[] = [
  {
    id: '1',
    sku: 'PKG-BOX-S',
    name: 'Small Corrugated Box',
    description: '10x10x10 cm corrugated box',
    category: 'Packaging',
    uom: 'PCS',
    price: 25,
    costPrice: 18,
    reorderPoint: 500,
    reorderQty: 1000,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    sku: 'PKG-BOX-M',
    name: 'Medium Corrugated Box',
    description: '20x20x20 cm corrugated box',
    category: 'Packaging',
    uom: 'PCS',
    price: 45,
    costPrice: 32,
    reorderPoint: 300,
    reorderQty: 500,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    sku: 'PKG-TAPE',
    name: 'Packaging Tape',
    description: 'Brown packaging tape 2 inch',
    category: 'Consumables',
    uom: 'ROLL',
    price: 80,
    costPrice: 55,
    reorderPoint: 200,
    reorderQty: 500,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: '1',
    code: 'SUP001',
    name: 'PackMart Supplies',
    contactPerson: 'Vijay Mehta',
    email: 'sales@packmart.com',
    phone: '9876543240',
    address: '123 Industrial Estate',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    gstNumber: '27AABCU9603R1ZP',
    rating: 4.5,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    code: 'SUP002',
    name: 'Stationery World',
    contactPerson: 'Neha Gupta',
    email: 'orders@stationeryworld.in',
    phone: '9876543241',
    address: '456 Commercial Complex',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    rating: 4.0,
    status: 'active',
    createdAt: '2024-01-02T00:00:00Z'
  }
];

export const initialWarehouses: Warehouse[] = [
  {
    id: '1',
    code: 'WH-MUM-01',
    name: 'Mumbai Main Warehouse',
    type: 'main',
    address: 'Plot 45, MIDC',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    capacity: 10000,
    usedCapacity: 6500,
    managerName: 'Suresh Verma',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    code: 'WH-DEL-01',
    name: 'Delhi Regional Warehouse',
    type: 'regional',
    address: 'Sector 18, Gurgaon',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    capacity: 8000,
    usedCapacity: 4200,
    managerName: 'Ramesh Singh',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const initialStockLevels: StockLevel[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Small Corrugated Box',
    productSku: 'PKG-BOX-S',
    warehouseId: '1',
    warehouseName: 'Mumbai Main Warehouse',
    quantity: 2500,
    reservedQty: 200,
    availableQty: 2300,
    lastUpdated: '2024-12-28T10:00:00Z'
  },
  {
    id: '2',
    productId: '2',
    productName: 'Medium Corrugated Box',
    productSku: 'PKG-BOX-M',
    warehouseId: '1',
    warehouseName: 'Mumbai Main Warehouse',
    quantity: 1500,
    reservedQty: 100,
    availableQty: 1400,
    lastUpdated: '2024-12-28T10:00:00Z'
  },
  {
    id: '3',
    productId: '3',
    productName: 'Packaging Tape',
    productSku: 'PKG-TAPE',
    warehouseId: '1',
    warehouseName: 'Mumbai Main Warehouse',
    quantity: 150,
    reservedQty: 0,
    availableQty: 150,
    lastUpdated: '2024-12-28T10:00:00Z'
  }
];

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    poNumber: 'PO000001',
    supplierId: '1',
    supplierName: 'PackMart Supplies',
    warehouseId: '1',
    warehouseName: 'Mumbai Main Warehouse',
    items: [
      {
        productId: '1',
        productName: 'Small Corrugated Box',
        productSku: 'PKG-BOX-S',
        quantity: 1000,
        unitPrice: 18,
        taxRate: 18,
        taxAmount: 3240,
        totalAmount: 21240
      }
    ],
    subtotal: 18000,
    taxTotal: 3240,
    discount: 0,
    totalAmount: 21240,
    expectedDate: '2024-12-30',
    status: 'approved',
    createdBy: 'Admin',
    createdAt: '2024-12-25T10:00:00Z',
    updatedAt: '2024-12-26T10:00:00Z'
  }
];

export const initialGRNs: GRN[] = [];

export const initialSalesOrders: SalesOrder[] = [
  {
    id: '1',
    soNumber: 'SO000001',
    customerId: '1',
    customerName: 'ABC Electronics',
    warehouseId: '1',
    warehouseName: 'Mumbai Main Warehouse',
    items: [
      {
        productId: '1',
        productName: 'Small Corrugated Box',
        productSku: 'PKG-BOX-S',
        quantity: 100,
        unitPrice: 25,
        taxRate: 18,
        taxAmount: 450,
        totalAmount: 2950
      }
    ],
    subtotal: 2500,
    taxTotal: 450,
    discount: 0,
    totalAmount: 2950,
    shippingAddress: '123 MG Road, Mumbai',
    expectedDate: '2024-12-30',
    status: 'confirmed',
    createdBy: 'Admin',
    createdAt: '2024-12-27T10:00:00Z',
    updatedAt: '2024-12-27T10:00:00Z'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV000001',
    type: 'freight',
    customerId: '1',
    customerName: 'ABC Electronics',
    referenceId: '1',
    referenceType: 'docket',
    items: [
      {
        description: 'Freight Charges - DKT000001',
        quantity: 1,
        rate: 1500,
        taxRate: 18,
        taxAmount: 270,
        amount: 1770
      },
      {
        description: 'Handling Charges',
        quantity: 1,
        rate: 100,
        taxRate: 18,
        taxAmount: 18,
        amount: 118
      }
    ],
    subtotal: 1600,
    taxTotal: 288,
    discount: 0,
    totalAmount: 1888,
    paidAmount: 0,
    balanceAmount: 1888,
    dueDate: '2025-01-15',
    status: 'sent',
    createdAt: '2024-12-28T12:00:00Z',
    updatedAt: '2024-12-28T12:00:00Z'
  }
];

export const initialUsers: User[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'Admin User',
    email: 'admin@logistics.com',
    phone: '9876543200',
    role: 'super_admin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: 'Office Staff 1',
    email: 'staff1@logistics.com',
    phone: '9876543201',
    role: 'office_staff',
    officeId: '1',
    officeName: 'Mumbai Hub',
    status: 'active',
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    employeeId: 'EMP003',
    name: 'Truck Driver 1',
    email: 'driver1@logistics.com',
    phone: '9876543202',
    role: 'driver',
    officeId: '1',
    officeName: 'Mumbai Hub',
    status: 'active',
    createdAt: '2024-01-03T00:00:00Z'
  }
];
