import { useState } from 'react';
import { Download, FileText, BarChart3, TrendingUp, Package, Users, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage, formatCurrency, formatDate } from '@/hooks/useLocalStorage';
import { Docket, Invoice, PurchaseOrder, SalesOrder, StockLevel, Customer, Product } from '@/types';
import { 
  initialDockets, initialInvoices, initialPurchaseOrders, 
  initialSalesOrders, initialStockLevels, initialCustomers, initialProducts 
} from '@/data/initialData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [dockets] = useLocalStorage<Docket[]>('dockets', initialDockets);
  const [invoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const [purchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', initialPurchaseOrders);
  const [salesOrders] = useLocalStorage<SalesOrder[]>('salesOrders', initialSalesOrders);
  const [stockLevels] = useLocalStorage<StockLevel[]>('stockLevels', initialStockLevels);
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);

  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Shipment Stats
  const shipmentStats = {
    total: dockets.length,
    delivered: dockets.filter(d => d.status === 'delivered').length,
    inTransit: dockets.filter(d => d.status === 'in_transit').length,
    pending: dockets.filter(d => d.status === 'booked').length,
  };

  // Revenue Stats
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const pendingRevenue = invoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.balanceAmount, 0);

  // Shipment by status chart data
  const shipmentByStatus = [
    { name: 'Delivered', value: shipmentStats.delivered },
    { name: 'In Transit', value: shipmentStats.inTransit },
    { name: 'Booked', value: shipmentStats.pending },
  ];

  // Customer revenue data
  const customerRevenue = customers.map(c => {
    const revenue = invoices
      .filter(i => i.customerId === c.id && i.status === 'paid')
      .reduce((sum, i) => sum + i.totalAmount, 0);
    return { name: c.name, revenue };
  }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Stock value data
  const stockValue = stockLevels.map(sl => {
    const product = products.find(p => p.id === sl.productId);
    return {
      name: sl.productName,
      quantity: sl.quantity,
      value: sl.quantity * (product?.costPrice || 0),
    };
  });

  const totalStockValue = stockValue.reduce((sum, s) => sum + s.value, 0);

  // Low stock products
  const lowStockProducts = stockLevels.filter(sl => {
    const product = products.find(p => p.id === sl.productId);
    return product && sl.availableQty <= product.reorderPoint;
  });

  // Monthly revenue trend (mock data based on invoices)
  const monthlyTrend = [
    { month: 'Oct', revenue: 45000 },
    { month: 'Nov', revenue: 62000 },
    { month: 'Dec', revenue: 78000 },
  ];

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>From:</Label>
            <Input
              type="date"
              className="w-40"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label>To:</Label>
            <Input
              type="date"
              className="w-40"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipmentStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {shipmentStats.delivered} delivered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pendingRevenue)} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
            <p className="text-xs text-muted-foreground">
              {stockLevels.length} SKUs in stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter(c => c.status === 'active').length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={shipmentByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {shipmentByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Shipments</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(dockets, 'shipments')}>
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Docket #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dockets.slice(0, 5).map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.docketNumber}</TableCell>
                        <TableCell>{d.customerName}</TableCell>
                        <TableCell>{d.originOffice} → {d.destinationOffice}</TableCell>
                        <TableCell className="capitalize">{d.status.replace('_', ' ')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerRevenue} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="revenue" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoice Summary</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportToCSV(invoices, 'invoices')}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.customerName}</TableCell>
                      <TableCell>{formatCurrency(inv.totalAmount)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(inv.paidAmount)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(inv.balanceAmount)}</TableCell>
                      <TableCell className="capitalize">{inv.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Value by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockValue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">All products are well stocked</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Reorder Point</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map(sl => {
                        const product = products.find(p => p.id === sl.productId);
                        return (
                          <TableRow key={sl.id}>
                            <TableCell className="font-medium">{sl.productName}</TableCell>
                            <TableCell className="text-red-600">{sl.availableQty}</TableCell>
                            <TableCell>{product?.reorderPoint || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Stock Levels</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportToCSV(stockLevels, 'stock-levels')}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockLevels.map(sl => (
                    <TableRow key={sl.id}>
                      <TableCell className="font-medium">{sl.productSku}</TableCell>
                      <TableCell>{sl.productName}</TableCell>
                      <TableCell>{sl.warehouseName}</TableCell>
                      <TableCell>{sl.quantity}</TableCell>
                      <TableCell>{sl.reservedQty}</TableCell>
                      <TableCell>{sl.availableQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Report</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportToCSV(customers, 'customers')}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Shipments</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(c => {
                    const shipmentCount = dockets.filter(d => d.customerId === c.id).length;
                    const revenue = invoices
                      .filter(i => i.customerId === c.id && i.status === 'paid')
                      .reduce((sum, i) => sum + i.totalAmount, 0);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.code}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.city}</TableCell>
                        <TableCell>{formatCurrency(c.creditLimit)}</TableCell>
                        <TableCell>{shipmentCount}</TableCell>
                        <TableCell>{formatCurrency(revenue)}</TableCell>
                        <TableCell className="capitalize">{c.status}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
