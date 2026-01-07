import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Warehouse as WarehouseIcon, ArrowRightLeft } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage, generateId, formatCurrency } from '@/hooks/useLocalStorage';
import { Warehouse, StockLevel, Product } from '@/types';
import { initialWarehouses, initialStockLevels, initialProducts } from '@/data/initialData';
import { useToast } from '@/hooks/use-toast';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useLocalStorage<Warehouse[]>('warehouses', initialWarehouses);
  const [stockLevels, setStockLevels] = useLocalStorage<StockLevel[]>('stockLevels', initialStockLevels);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'main' as Warehouse['type'],
    address: '',
    city: '',
    state: '',
    pincode: '',
    capacity: '',
    managerName: '',
  });

  const [transferData, setTransferData] = useState({
    productId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: '',
  });

  const filteredWarehouses = warehouses.filter(wh =>
    wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStock = stockLevels.filter(sl =>
    selectedWarehouse === 'all' || sl.warehouseId === selectedWarehouse
  );

  const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
  const totalUsed = warehouses.reduce((sum, w) => sum + w.usedCapacity, 0);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'main',
      address: '',
      city: '',
      state: '',
      pincode: '',
      capacity: '',
      managerName: '',
    });
    setEditingWarehouse(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      code: warehouse.code,
      name: warehouse.name,
      type: warehouse.type,
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      pincode: warehouse.pincode,
      capacity: warehouse.capacity.toString(),
      managerName: warehouse.managerName || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const now = new Date().toISOString();

    if (editingWarehouse) {
      setWarehouses(warehouses.map(w =>
        w.id === editingWarehouse.id
          ? { ...w, ...formData, capacity: parseInt(formData.capacity) || 0 }
          : w
      ));
      toast({ title: 'Success', description: 'Warehouse updated successfully' });
    } else {
      const newWarehouse: Warehouse = {
        id: generateId(),
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        usedCapacity: 0,
        status: 'active',
        createdAt: now,
      };
      setWarehouses([...warehouses, newWarehouse]);
      toast({ title: 'Success', description: 'Warehouse created successfully' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleTransfer = () => {
    const { productId, fromWarehouseId, toWarehouseId, quantity } = transferData;
    const qty = parseInt(quantity);

    if (!productId || !fromWarehouseId || !toWarehouseId || !qty) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      toast({ title: 'Error', description: 'Source and destination must be different', variant: 'destructive' });
      return;
    }

    const sourceStock = stockLevels.find(s => s.productId === productId && s.warehouseId === fromWarehouseId);
    if (!sourceStock || sourceStock.availableQty < qty) {
      toast({ title: 'Error', description: 'Insufficient stock', variant: 'destructive' });
      return;
    }

    const product = products.find(p => p.id === productId);
    const toWarehouse = warehouses.find(w => w.id === toWarehouseId);
    const now = new Date().toISOString();

    setStockLevels(prev => {
      const updated = prev.map(s => {
        if (s.productId === productId && s.warehouseId === fromWarehouseId) {
          return { ...s, quantity: s.quantity - qty, availableQty: s.availableQty - qty, lastUpdated: now };
        }
        if (s.productId === productId && s.warehouseId === toWarehouseId) {
          return { ...s, quantity: s.quantity + qty, availableQty: s.availableQty + qty, lastUpdated: now };
        }
        return s;
      });

      // If destination stock doesn't exist, create it
      if (!prev.find(s => s.productId === productId && s.warehouseId === toWarehouseId)) {
        updated.push({
          id: generateId(),
          productId,
          productName: product?.name || '',
          productSku: product?.sku || '',
          warehouseId: toWarehouseId,
          warehouseName: toWarehouse?.name || '',
          quantity: qty,
          reservedQty: 0,
          availableQty: qty,
          lastUpdated: now,
        });
      }

      return updated;
    });

    toast({ title: 'Success', description: `Transferred ${qty} units successfully` });
    setIsTransferDialogOpen(false);
    setTransferData({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });
  };

  const handleDelete = (id: string) => {
    setWarehouses(warehouses.filter(w => w.id !== id));
    toast({ title: 'Success', description: 'Warehouse deleted successfully' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warehouses & Stock</h1>
          <p className="text-muted-foreground">Manage warehouses and inventory levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTransferDialogOpen(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Stock
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add Warehouse
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsed.toLocaleString()}</div>
            <Progress value={(totalUsed / totalCapacity) * 100} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKUs in Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockLevels.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="warehouses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search warehouses..."
                  className="pl-10 max-w-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarehouses.map((wh) => (
                    <TableRow key={wh.id}>
                      <TableCell className="font-medium">{wh.code}</TableCell>
                      <TableCell>{wh.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{wh.type}</Badge>
                      </TableCell>
                      <TableCell>{wh.city}</TableCell>
                      <TableCell>{wh.managerName || '-'}</TableCell>
                      <TableCell>{wh.capacity.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="text-sm">{wh.usedCapacity.toLocaleString()}</div>
                          <Progress value={(wh.usedCapacity / wh.capacity) * 100} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={wh.status === 'active' ? 'default' : 'secondary'}>
                          {wh.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(wh)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(wh.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map(wh => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((stock) => {
                    const product = products.find(p => p.id === stock.productId);
                    const isLowStock = product && stock.availableQty <= product.reorderPoint;
                    return (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.productSku}</TableCell>
                        <TableCell>{stock.productName}</TableCell>
                        <TableCell>{stock.warehouseName}</TableCell>
                        <TableCell>{stock.quantity.toLocaleString()}</TableCell>
                        <TableCell>{stock.reservedQty.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={isLowStock ? 'text-red-600 font-medium' : ''}>
                            {stock.availableQty.toLocaleString()}
                          </span>
                          {isLowStock && <Badge variant="destructive" className="ml-2">Low</Badge>}
                        </TableCell>
                        <TableCell>{new Date(stock.lastUpdated).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warehouse Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Warehouse Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., WH-CHN-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Warehouse Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Warehouse name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(v: Warehouse['type']) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="transit">Transit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Pincode"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="managerName">Manager Name</Label>
              <Input
                id="managerName"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="Manager name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingWarehouse ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={transferData.productId} onValueChange={(v) => setTransferData({ ...transferData, productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.sku} - {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Warehouse</Label>
              <Select value={transferData.fromWarehouseId} onValueChange={(v) => setTransferData({ ...transferData, fromWarehouseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Warehouse</Label>
              <Select value={transferData.toWarehouseId} onValueChange={(v) => setTransferData({ ...transferData, toWarehouseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={transferData.quantity}
                onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransfer}>Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Warehouses;
