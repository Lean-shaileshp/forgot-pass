import { useState } from 'react';
import { Plus, Search, Filter, Eye, Send, DollarSign, Receipt, AlertCircle, Printer, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { printInvoice } from '@/utils/printUtils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailPreviewModal } from '@/components/EmailPreviewModal';
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
import { Invoice, InvoiceItem, Customer, Docket } from '@/types';
import { initialInvoices, initialCustomers, initialDockets } from '@/data/initialData';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const Billing = () => {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [dockets] = useLocalStorage<Docket[]>('dockets', initialDockets);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  type EmailPreviewData = {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    trackingNumber: string;
    details: Record<string, string | number>;
  };
  const [emailPreviewData, setEmailPreviewData] = useState<EmailPreviewData | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: 'freight' as Invoice['type'],
    customerId: '',
    dueDate: '',
    discount: '0',
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: '1',
    rate: '',
    taxRate: '18',
  });

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateTotals = (invItems: InvoiceItem[], discount: number) => {
    const subtotal = invItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxTotal = invItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxTotal - discount;
    return { subtotal, taxTotal, totalAmount };
  };

  const totalOutstanding = invoices
    .filter(i => ['sent', 'partial', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + i.balanceAmount, 0);

  const totalOverdue = invoices
    .filter(i => i.status === 'overdue')
    .reduce((sum, i) => sum + i.balanceAmount, 0);

  const resetForm = () => {
    setFormData({
      type: 'freight',
      customerId: '',
      dueDate: '',
      discount: '0',
    });
    setItems([]);
    setNewItem({ description: '', quantity: '1', rate: '', taxRate: '18' });
  };

  const addItem = () => {
    if (!newItem.description || !newItem.rate) {
      toast({ title: 'Error', description: 'Please fill all item fields', variant: 'destructive' });
      return;
    }

    const qty = parseInt(newItem.quantity) || 1;
    const rate = parseFloat(newItem.rate);
    const taxRate = parseFloat(newItem.taxRate);
    const taxAmount = (qty * rate * taxRate) / 100;
    const amount = (qty * rate) + taxAmount;

    const item: InvoiceItem = {
      description: newItem.description,
      quantity: qty,
      rate,
      taxRate,
      taxAmount,
      amount,
    };

    setItems([...items, item]);
    setNewItem({ description: '', quantity: '1', rate: '', taxRate: '18' });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!formData.customerId || items.length === 0) {
      toast({ title: 'Error', description: 'Please fill all required fields and add items', variant: 'destructive' });
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    const discount = parseFloat(formData.discount) || 0;
    const { subtotal, taxTotal, totalAmount } = calculateTotals(items, discount);
    const now = new Date().toISOString();
    const invoiceNumber = generateNumber('INV', invoices.map(i => i.invoiceNumber));

    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNumber,
      type: formData.type,
      customerId: formData.customerId,
      customerName: customer?.name || '',
      items,
      subtotal,
      taxTotal,
      discount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      dueDate: formData.dueDate,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    setInvoices([...invoices, newInvoice]);
    toast({ title: 'Success', description: 'Invoice created successfully' });
    setIsDialogOpen(false);
    resetForm();
  };

  const sendInvoice = (inv: Invoice) => {
    const customer = customers.find(c => c.id === inv.customerId);
    setEmailPreviewData({
      recipientEmail: customer?.email || 'customer@example.com',
      recipientName: inv.customerName,
      subject: `Invoice ${inv.invoiceNumber} from Logistics Management System`,
      trackingNumber: inv.invoiceNumber,
      details: {
        'Invoice Number': inv.invoiceNumber,
        'Amount': formatCurrency(inv.totalAmount),
        'Due Date': formatDate(inv.dueDate),
        'Status': inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
      }
    });
    setIsEmailPreviewOpen(true);
    
    // Mark as sent
    const now = new Date().toISOString();
    setInvoices(invoices.map(i =>
      i.id === inv.id ? { ...i, status: 'sent', updatedAt: now } : i
    ));
  };

  const recordPayment = () => {
    if (!viewingInvoice || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > viewingInvoice.balanceAmount) {
      toast({ title: 'Error', description: 'Invalid payment amount', variant: 'destructive' });
      return;
    }

    const now = new Date().toISOString();
    const newPaidAmount = viewingInvoice.paidAmount + amount;
    const newBalance = viewingInvoice.totalAmount - newPaidAmount;
    const newStatus = newBalance <= 0 ? 'paid' : 'partial';

    setInvoices(invoices.map(inv =>
      inv.id === viewingInvoice.id
        ? { ...inv, paidAmount: newPaidAmount, balanceAmount: newBalance, status: newStatus, updatedAt: now }
        : inv
    ));

    toast({ title: 'Success', description: `Payment of ${formatCurrency(amount)} recorded` });
    setIsPaymentDialogOpen(false);
    setPaymentAmount('');
    setViewingInvoice({ ...viewingInvoice, paidAmount: newPaidAmount, balanceAmount: newBalance, status: newStatus });
  };

  const totals = calculateTotals(items, parseFloat(formData.discount) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Invoices</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0))}
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
                placeholder="Search invoices..."
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
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell className="capitalize">{inv.type}</TableCell>
                  <TableCell>{inv.customerName}</TableCell>
                  <TableCell>{formatCurrency(inv.totalAmount)}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(inv.paidAmount)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(inv.balanceAmount)}</TableCell>
                  <TableCell>{formatDate(inv.dueDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[inv.status]}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setViewingInvoice(inv); setIsViewDialogOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => printInvoice(inv)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    {inv.status === 'draft' && (
                      <Button variant="ghost" size="icon" onClick={() => sendInvoice(inv)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {['sent', 'partial', 'overdue'].includes(inv.status) && (
                      <Button variant="ghost" size="sm" onClick={() => { setViewingInvoice(inv); setIsPaymentDialogOpen(true); }}>
                        <DollarSign className="h-4 w-4 mr-1" /> Pay
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Invoice Type</Label>
                <Select value={formData.type} onValueChange={(v: Invoice['type']) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freight">Freight</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
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
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Line Items</h3>
              <div className="grid grid-cols-5 gap-2">
                <Input
                  placeholder="Description"
                  className="col-span-2"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Rate"
                  value={newItem.rate}
                  onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
                />
                <Button onClick={addItem}>Add</Button>
              </div>

              {items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.rate)}</TableCell>
                        <TableCell>{formatCurrency(item.taxAmount)}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>×</Button>
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
            <Button onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Invoice:</strong> {viewingInvoice.invoiceNumber}</div>
                <div><strong>Status:</strong> <Badge className={statusColors[viewingInvoice.status]}>{viewingInvoice.status}</Badge></div>
                <div><strong>Customer:</strong> {viewingInvoice.customerName}</div>
                <div><strong>Type:</strong> {viewingInvoice.type}</div>
                <div><strong>Due Date:</strong> {formatDate(viewingInvoice.dueDate)}</div>
                <div><strong>Created:</strong> {formatDate(viewingInvoice.createdAt)}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingInvoice.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.rate)}</TableCell>
                      <TableCell>{formatCurrency(item.taxAmount)}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right space-y-1">
                <div>Subtotal: {formatCurrency(viewingInvoice.subtotal)}</div>
                <div>Tax: {formatCurrency(viewingInvoice.taxTotal)}</div>
                <div>Discount: {formatCurrency(viewingInvoice.discount)}</div>
                <div className="font-bold">Total: {formatCurrency(viewingInvoice.totalAmount)}</div>
                <div className="text-green-600">Paid: {formatCurrency(viewingInvoice.paidAmount)}</div>
                <div className="text-red-600 font-bold">Balance: {formatCurrency(viewingInvoice.balanceAmount)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-4 py-4">
              <div><strong>Invoice:</strong> {viewingInvoice.invoiceNumber}</div>
              <div><strong>Balance Due:</strong> {formatCurrency(viewingInvoice.balanceAmount)}</div>
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  max={viewingInvoice.balanceAmount}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={recordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Preview Modal */}
      {emailPreviewData && (
        <EmailPreviewModal
          open={isEmailPreviewOpen}
          onOpenChange={setIsEmailPreviewOpen}
          type="invoice"
          data={emailPreviewData}
        />
      )}
    </div>
  );
};

export default Billing;
