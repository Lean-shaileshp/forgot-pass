import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, ShoppingBag } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage, generateId, generateNumber, formatCurrency, formatDate } from '@/hooks/useLocalStorage';
import { SalesOrder, SalesOrderItem, Customer, Warehouse, Product, StockLevel } from '@/types';
import { initialSalesOrders, initialCustomers, initialWarehouses, initialProducts, initialStockLevels } from '@/data/initialData';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  dispatched: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const SalesOrders = () => {
  const [salesOrders, setSalesOrders] = useLocalStorage<SalesOrder[]>('salesOrders', initialSalesOrders);
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [warehouses] = useLocalStorage<Warehouse[]>('warehouses', initialWarehouses);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const [stockLevels, setStockLevels] = useLocalStorage<StockLevel[]>('stockLevels', initialStockLevels);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingSO, setEditingSO] = useState<SalesOrder | null>(null);
  const [viewingSO, setViewingSO] = useState<SalesOrder | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customerId: '',
    warehouseId: '',
    shippingAddress: '',
    expectedDate: '',
    discount: '0',
  });

  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: '',
    unitPrice: '',
    taxRate: '18',
  });

  const filteredSOs = salesOrders.filter(so => {
    const matchesSearch = so.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      so.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || so.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateTotals = (orderItems: SalesOrderItem[], discount: number) => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = orderItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxTotal - discount;
    return { subtotal, taxTotal, totalAmount };
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      warehouseId: '',
      shippingAddress: '',
      expectedDate: '',
      discount: '0',
    });
    setItems([]);
    setNewItem({ productId: '', quantity: '', unitPrice: '', taxRate: '18' });
    setEditingSO(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (so: SalesOrder) => {
    setEditingSO(so);
    setFormData({
      customerId: so.customerId,
      warehouseId: so.warehouseId,
      shippingAddress: so.shippingAddress,
      expectedDate: so.expectedDate,
      discount: so.discount.toString(),
    });
    setItems(so.items);
    setIsDialogOpen(true);
  };

  const addItem = () => {
    const product = products.find(p => p.id === newItem.productId);
    if (!product || !newItem.quantity || !newItem.unitPrice) {
      toast({ title: 'Error', description: 'Please fill all item fields', variant: 'destructive' });
      return;
    }

    const qty = parseInt(newItem.quantity);
    const price = parseFloat(newItem.unitPrice);
    const taxRate = parseFloat(newItem.taxRate);
    const taxAmount = (qty * price * taxRate) / 100;
    const totalAmount = (qty * price) + taxAmount;

    const item: SalesOrderItem = {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: qty,
      unitPrice: price,
      taxRate,
      taxAmount,
      totalAmount,
    };

    setItems([...items, item]);
    setNewItem({ productId: '', quantity: '', unitPrice: '', taxRate: '18' });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!formData.customerId || !formData.warehouseId || items.length === 0) {
      toast({ title: 'Error', description: 'Please fill all required fields and add items', variant: 'destructive' });
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    const warehouse = warehouses.find(w => w.id === formData.warehouseId);
    const discount = parseFloat(formData.discount) || 0;
    const { subtotal, taxTotal, totalAmount } = calculateTotals(items, discount);
    const now = new Date().toISOString();

    if (editingSO) {
      setSalesOrders(salesOrders.map(so =>
        so.id === editingSO.id
          ? {
              ...so,
              customerId: formData.customerId,
              customerName: customer?.name || '',
              warehouseId: formData.warehouseId,
              warehouseName: warehouse?.name || '',
              items,
              subtotal,
              taxTotal,
              discount,
              totalAmount,
              shippingAddress: formData.shippingAddress,
              expectedDate: formData.expectedDate,
              updatedAt: now,
            }
          : so
      ));
      toast({ title: 'Success', description: 'Sales order updated successfully' });
    } else {
      const soNumber = generateNumber('SO', salesOrders.map(so => so.soNumber));
      const newSO: SalesOrder = {
        id: generateId(),
        soNumber,
        customerId: formData.customerId,
        customerName: customer?.name || '',
        warehouseId: formData.warehouseId,
        warehouseName: warehouse?.name || '',
        items,
        subtotal,
        taxTotal,
        discount,
        totalAmount,
        shippingAddress: formData.shippingAddress || customer?.address || '',
        expectedDate: formData.expectedDate,
        status: 'draft',
        createdBy: 'Admin',
        createdAt: now,
        updatedAt: now,
      };
      setSalesOrders([...salesOrders, newSO]);
      toast({ title: 'Success', description: 'Sales order created successfully' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const updateStatus = (id: string, status: SalesOrder['status']) => {
    const now = new Date().toISOString();
    const so = salesOrders.find(s => s.id === id);

    // If confirming, reserve stock
    if (status === 'confirmed' && so) {
      setStockLevels(prev => prev.map(sl => {
        const item = so.items.find(i => i.productId === sl.productId && so.warehouseId === sl.warehouseId);
        if (item) {
          return {
            ...sl,
            reservedQty: sl.reservedQty + item.quantity,
            availableQty: sl.availableQty - item.quantity,
            lastUpdated: now,
          };
        }
        return sl;
      }));
    }

    // If dispatching, deduct stock
    if (status === 'dispatched' && so) {
      setStockLevels(prev => prev.map(sl => {
        const item = so.items.find(i => i.productId === sl.productId && so.warehouseId === sl.warehouseId);
        if (item) {
          return {
            ...sl,
            quantity: sl.quantity - item.quantity,
            reservedQty: sl.reservedQty - item.quantity,
            lastUpdated: now,
          };
        }
        return sl;
      }));
    }

    setSalesOrders(salesOrders.map(s =>
      s.id === id ? { ...s, status, updatedAt: now } : s
    ));
    toast({ title: 'Success', description: `Order ${status}` });
  };

  const handleDelete = (id: string) => {
    setSalesOrders(salesOrders.filter(so => so.id !== id));
    toast({ title: 'Success', description: 'Sales order deleted successfully' });
  };

  const totals = calculateTotals(items, parseFloat(formData.discount) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and dispatch</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Create Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesOrders.length}</div>
          </CardContent>
        </Card>
        {['draft', 'confirmed', 'processing', 'delivered'].map(status => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">{status}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesOrders.filter(so => so.status === status).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by SO number or customer..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SO Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Expected Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSOs.map((so) => (
                <TableRow key={so.id}>
                  <TableCell className="font-medium">{so.soNumber}</TableCell>
                  <TableCell>{so.customerName}</TableCell>
                  <TableCell>{so.warehouseName}</TableCell>
                  <TableCell>{so.items.length}</TableCell>
                  <TableCell>{formatCurrency(so.totalAmount)}</TableCell>
                  <TableCell>{formatDate(so.expectedDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[so.status]}>{so.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setViewingSO(so); setIsViewDialogOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {so.status === 'draft' && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(so)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => updateStatus(so.id, 'confirmed')}>
                          Confirm
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(so.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {so.status === 'confirmed' && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(so.id, 'processing')}>
                        Process
                      </Button>
                    )}
                    {so.status === 'processing' && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(so.id, 'dispatched')}>
                        Dispatch
                      </Button>
                    )}
                    {so.status === 'dispatched' && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(so.id, 'delivered')}>
                        Deliver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSO ? 'Edit Sales Order' : 'Create Sales Order'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={formData.customerId} onValueChange={(v) => {
                  const customer = customers.find(c => c.id === v);
                  setFormData({ ...formData, customerId: v, shippingAddress: customer?.address || '' });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Warehouse *</Label>
                <Select value={formData.warehouseId} onValueChange={(v) => setFormData({ ...formData, warehouseId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Date</Label>
                <Input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Shipping Address</Label>
              <Input
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                placeholder="Delivery address"
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Add Items</h3>
              <div className="grid grid-cols-5 gap-2">
                <Select value={newItem.productId} onValueChange={(v) => {
                  const product = products.find(p => p.id === v);
                  setNewItem({ ...newItem, productId: v, unitPrice: product?.price.toString() || '' });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.sku} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Unit Price"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Tax %"
                  value={newItem.taxRate}
                  onChange={(e) => setNewItem({ ...newItem, taxRate: e.target.value })}
                />
                <Button onClick={addItem}>Add</Button>
              </div>

              {items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.taxAmount)}</TableCell>
                        <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(totals.subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax:</span><span>{formatCurrency(totals.taxTotal)}</span></div>
                <div className="flex justify-between items-center">
                  <span>Discount:</span>
                  <Input
                    type="number"
                    className="w-24"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span><span>{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingSO ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sales Order Details</DialogTitle>
          </DialogHeader>
          {viewingSO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>SO Number:</strong> {viewingSO.soNumber}</div>
                <div><strong>Status:</strong> <Badge className={statusColors[viewingSO.status]}>{viewingSO.status}</Badge></div>
                <div><strong>Customer:</strong> {viewingSO.customerName}</div>
                <div><strong>Warehouse:</strong> {viewingSO.warehouseName}</div>
                <div><strong>Expected Date:</strong> {formatDate(viewingSO.expectedDate)}</div>
                <div><strong>Created:</strong> {formatDate(viewingSO.createdAt)}</div>
                <div className="col-span-2"><strong>Shipping:</strong> {viewingSO.shippingAddress}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingSO.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.taxAmount)}</TableCell>
                      <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right space-y-1">
                <div>Subtotal: {formatCurrency(viewingSO.subtotal)}</div>
                <div>Tax: {formatCurrency(viewingSO.taxTotal)}</div>
                <div>Discount: {formatCurrency(viewingSO.discount)}</div>
                <div className="font-bold text-lg">Total: {formatCurrency(viewingSO.totalAmount)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesOrders;
