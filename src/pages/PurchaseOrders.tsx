import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Check, X, ShoppingCart } from 'lucide-react';
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
import { PurchaseOrder, PurchaseOrderItem, Supplier, Warehouse, Product } from '@/types';
import { initialPurchaseOrders, initialSuppliers, initialWarehouses, initialProducts } from '@/data/initialData';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  received: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', initialPurchaseOrders);
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', initialSuppliers);
  const [warehouses] = useLocalStorage<Warehouse[]>('warehouses', initialWarehouses);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
    expectedDate: '',
    remarks: '',
    discount: '0',
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: '',
    unitPrice: '',
    taxRate: '18',
  });

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateTotals = (orderItems: PurchaseOrderItem[], discount: number) => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = orderItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxTotal - discount;
    return { subtotal, taxTotal, totalAmount };
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      warehouseId: '',
      expectedDate: '',
      remarks: '',
      discount: '0',
    });
    setItems([]);
    setNewItem({ productId: '', quantity: '', unitPrice: '', taxRate: '18' });
    setEditingPO(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (po: PurchaseOrder) => {
    setEditingPO(po);
    setFormData({
      supplierId: po.supplierId,
      warehouseId: po.warehouseId,
      expectedDate: po.expectedDate,
      remarks: po.remarks || '',
      discount: po.discount.toString(),
    });
    setItems(po.items);
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

    const item: PurchaseOrderItem = {
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
    if (!formData.supplierId || !formData.warehouseId || items.length === 0) {
      toast({ title: 'Error', description: 'Please fill all required fields and add items', variant: 'destructive' });
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplierId);
    const warehouse = warehouses.find(w => w.id === formData.warehouseId);
    const discount = parseFloat(formData.discount) || 0;
    const { subtotal, taxTotal, totalAmount } = calculateTotals(items, discount);
    const now = new Date().toISOString();

    if (editingPO) {
      setPurchaseOrders(purchaseOrders.map(po =>
        po.id === editingPO.id
          ? {
              ...po,
              supplierId: formData.supplierId,
              supplierName: supplier?.name || '',
              warehouseId: formData.warehouseId,
              warehouseName: warehouse?.name || '',
              items,
              subtotal,
              taxTotal,
              discount,
              totalAmount,
              expectedDate: formData.expectedDate,
              remarks: formData.remarks,
              updatedAt: now,
            }
          : po
      ));
      toast({ title: 'Success', description: 'Purchase order updated successfully' });
    } else {
      const poNumber = generateNumber('PO', purchaseOrders.map(po => po.poNumber));
      const newPO: PurchaseOrder = {
        id: generateId(),
        poNumber,
        supplierId: formData.supplierId,
        supplierName: supplier?.name || '',
        warehouseId: formData.warehouseId,
        warehouseName: warehouse?.name || '',
        items,
        subtotal,
        taxTotal,
        discount,
        totalAmount,
        expectedDate: formData.expectedDate,
        status: 'draft',
        remarks: formData.remarks,
        createdBy: 'Admin',
        createdAt: now,
        updatedAt: now,
      };
      setPurchaseOrders([...purchaseOrders, newPO]);
      toast({ title: 'Success', description: 'Purchase order created successfully' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const updateStatus = (id: string, status: PurchaseOrder['status']) => {
    const now = new Date().toISOString();
    setPurchaseOrders(purchaseOrders.map(po =>
      po.id === id
        ? {
            ...po,
            status,
            ...(status === 'approved' ? { approvedBy: 'Admin', approvedAt: now } : {}),
            updatedAt: now,
          }
        : po
    ));
    toast({ title: 'Success', description: `Order ${status}` });
  };

  const handleDelete = (id: string) => {
    setPurchaseOrders(purchaseOrders.filter(po => po.id !== id));
    toast({ title: 'Success', description: 'Purchase order deleted successfully' });
  };

  const totals = calculateTotals(items, parseFloat(formData.discount) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage procurement orders</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Create PO
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOrders.length}</div>
          </CardContent>
        </Card>
        {['draft', 'pending', 'approved', 'received'].map(status => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">{status}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchaseOrders.filter(po => po.status === status).length}
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
                placeholder="Search by PO number or supplier..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Expected Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOs.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.poNumber}</TableCell>
                  <TableCell>{po.supplierName}</TableCell>
                  <TableCell>{po.warehouseName}</TableCell>
                  <TableCell>{po.items.length}</TableCell>
                  <TableCell>{formatCurrency(po.totalAmount)}</TableCell>
                  <TableCell>{formatDate(po.expectedDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[po.status]}>{po.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setViewingPO(po); setIsViewDialogOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {po.status === 'draft' && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(po)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => updateStatus(po.id, 'pending')}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      </>
                    )}
                    {po.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => updateStatus(po.id, 'approved')}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => updateStatus(po.id, 'rejected')}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    {po.status === 'draft' && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(po.id)}>
                        <Trash2 className="h-4 w-4" />
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
            <DialogTitle>{editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Add Items</h3>
              <div className="grid grid-cols-5 gap-2">
                <Select value={newItem.productId} onValueChange={(v) => {
                  const product = products.find(p => p.id === v);
                  setNewItem({ ...newItem, productId: v, unitPrice: product?.costPrice.toString() || '' });
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

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingPO ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          {viewingPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>PO Number:</strong> {viewingPO.poNumber}</div>
                <div><strong>Status:</strong> <Badge className={statusColors[viewingPO.status]}>{viewingPO.status}</Badge></div>
                <div><strong>Supplier:</strong> {viewingPO.supplierName}</div>
                <div><strong>Warehouse:</strong> {viewingPO.warehouseName}</div>
                <div><strong>Expected Date:</strong> {formatDate(viewingPO.expectedDate)}</div>
                <div><strong>Created:</strong> {formatDate(viewingPO.createdAt)}</div>
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
                  {viewingPO.items.map((item, index) => (
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
                <div>Subtotal: {formatCurrency(viewingPO.subtotal)}</div>
                <div>Tax: {formatCurrency(viewingPO.taxTotal)}</div>
                <div>Discount: {formatCurrency(viewingPO.discount)}</div>
                <div className="font-bold text-lg">Total: {formatCurrency(viewingPO.totalAmount)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
