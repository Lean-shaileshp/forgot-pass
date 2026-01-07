import { useState } from 'react';
import { Plus, Search, Filter, Eye, Package, ClipboardCheck } from 'lucide-react';
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
import { useLocalStorage, generateId, generateNumber, formatDate } from '@/hooks/useLocalStorage';
import { GRN, GRNItem, PurchaseOrder, StockLevel } from '@/types';
import { initialGRNs, initialPurchaseOrders, initialStockLevels } from '@/data/initialData';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  completed: 'bg-green-100 text-green-800',
  discrepancy: 'bg-red-100 text-red-800',
};

const GRNPage = () => {
  const [grns, setGRNs] = useLocalStorage<GRN[]>('grns', initialGRNs);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', initialPurchaseOrders);
  const [stockLevels, setStockLevels] = useLocalStorage<StockLevel[]>('stockLevels', initialStockLevels);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingGRN, setViewingGRN] = useState<GRN | null>(null);
  const { toast } = useToast();

  const approvedPOs = purchaseOrders.filter(po => po.status === 'approved');

  const [formData, setFormData] = useState({
    poId: '',
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmount: '',
    remarks: '',
  });

  const [items, setItems] = useState<GRNItem[]>([]);

  const filteredGRNs = grns.filter(grn => {
    const matchesSearch = grn.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grn.poNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || grn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectPO = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setFormData({ ...formData, poId });
      setItems(po.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        orderedQty: item.quantity,
        receivedQty: item.quantity,
        acceptedQty: item.quantity,
        rejectedQty: 0,
      })));
    }
  };

  const updateItemQty = (index: number, field: 'receivedQty' | 'acceptedQty' | 'rejectedQty', value: number) => {
    setItems(items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'receivedQty') {
        updated.acceptedQty = value;
        updated.rejectedQty = 0;
      } else if (field === 'acceptedQty') {
        updated.rejectedQty = updated.receivedQty - value;
      } else if (field === 'rejectedQty') {
        updated.acceptedQty = updated.receivedQty - value;
      }
      return updated;
    }));
  };

  const handleSubmit = () => {
    if (!formData.poId || items.length === 0) {
      toast({ title: 'Error', description: 'Please select a PO', variant: 'destructive' });
      return;
    }

    const po = purchaseOrders.find(p => p.id === formData.poId);
    if (!po) return;

    const hasDiscrepancy = items.some(item => item.rejectedQty > 0 || item.receivedQty !== item.orderedQty);
    const now = new Date().toISOString();
    const grnNumber = generateNumber('GRN', grns.map(g => g.grnNumber));

    const newGRN: GRN = {
      id: generateId(),
      grnNumber,
      poId: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      warehouseId: po.warehouseId,
      warehouseName: po.warehouseName,
      items,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
      invoiceAmount: parseFloat(formData.invoiceAmount) || undefined,
      receivedBy: 'Admin',
      receivedAt: now,
      remarks: formData.remarks,
      status: hasDiscrepancy ? 'discrepancy' : 'completed',
      createdAt: now,
    };

    setGRNs([...grns, newGRN]);

    // Update PO status
    setPurchaseOrders(purchaseOrders.map(p =>
      p.id === po.id ? { ...p, status: 'received', updatedAt: now } : p
    ));

    // Update stock levels
    setStockLevels(prev => {
      const updated = [...prev];
      items.forEach(item => {
        const existingIndex = updated.findIndex(s => 
          s.productId === item.productId && s.warehouseId === po.warehouseId
        );
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + item.acceptedQty,
            availableQty: updated[existingIndex].availableQty + item.acceptedQty,
            lastUpdated: now,
          };
        } else {
          updated.push({
            id: generateId(),
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            warehouseId: po.warehouseId,
            warehouseName: po.warehouseName,
            quantity: item.acceptedQty,
            reservedQty: 0,
            availableQty: item.acceptedQty,
            lastUpdated: now,
          });
        }
      });
      return updated;
    });

    toast({ title: 'Success', description: 'GRN created and stock updated' });
    setIsDialogOpen(false);
    setFormData({ poId: '', invoiceNumber: '', invoiceDate: '', invoiceAmount: '', remarks: '' });
    setItems([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Goods Received Notes</h1>
          <p className="text-muted-foreground">Receive goods against purchase orders</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} disabled={approvedPOs.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Create GRN
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total GRNs</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending POs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{approvedPOs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {grns.filter(g => g.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {grns.filter(g => g.status === 'discrepancy').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by GRN or PO number..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="discrepancy">Discrepancy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GRN Number</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Received Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGRNs.map((grn) => (
                <TableRow key={grn.id}>
                  <TableCell className="font-medium">{grn.grnNumber}</TableCell>
                  <TableCell>{grn.poNumber}</TableCell>
                  <TableCell>{grn.supplierName}</TableCell>
                  <TableCell>{grn.warehouseName}</TableCell>
                  <TableCell>{grn.items.length}</TableCell>
                  <TableCell>{formatDate(grn.receivedAt)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[grn.status]}>{grn.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setViewingGRN(grn); setIsViewDialogOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredGRNs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No GRNs found. Create one from an approved PO.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create GRN Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Goods Received Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Purchase Order *</Label>
                <Select value={formData.poId} onValueChange={selectPO}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select approved PO" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedPOs.map(po => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.poNumber} - {po.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="Supplier invoice number"
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Amount</Label>
                <Input
                  type="number"
                  value={formData.invoiceAmount}
                  onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {items.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">Receive Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Accepted</TableHead>
                      <TableHead>Rejected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.orderedQty}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20"
                            value={item.receivedQty}
                            onChange={(e) => updateItemQty(index, 'receivedQty', parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20"
                            value={item.acceptedQty}
                            onChange={(e) => updateItemQty(index, 'acceptedQty', parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20"
                            value={item.rejectedQty}
                            onChange={(e) => updateItemQty(index, 'rejectedQty', parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

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
            <Button onClick={handleSubmit}>Create GRN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View GRN Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>GRN Details</DialogTitle>
          </DialogHeader>
          {viewingGRN && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>GRN Number:</strong> {viewingGRN.grnNumber}</div>
                <div><strong>Status:</strong> <Badge className={statusColors[viewingGRN.status]}>{viewingGRN.status}</Badge></div>
                <div><strong>PO Number:</strong> {viewingGRN.poNumber}</div>
                <div><strong>Supplier:</strong> {viewingGRN.supplierName}</div>
                <div><strong>Warehouse:</strong> {viewingGRN.warehouseName}</div>
                <div><strong>Received:</strong> {formatDate(viewingGRN.receivedAt)}</div>
                {viewingGRN.invoiceNumber && <div><strong>Invoice:</strong> {viewingGRN.invoiceNumber}</div>}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Accepted</TableHead>
                    <TableHead>Rejected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingGRN.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.orderedQty}</TableCell>
                      <TableCell>{item.receivedQty}</TableCell>
                      <TableCell className="text-green-600">{item.acceptedQty}</TableCell>
                      <TableCell className="text-red-600">{item.rejectedQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GRNPage;
