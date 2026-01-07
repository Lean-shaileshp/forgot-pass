import { useState } from "react";
import { Plus, Search, MoreHorizontal, Package, MapPin, ArrowRight, Pencil, Trash2, Printer, Download, QrCode, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printDocket } from "@/utils/printUtils";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage, generateId, generateNumber, formatCurrency } from "@/hooks/useLocalStorage";
import { useTableState, usePaginatedData } from "@/hooks/useTableState";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { exportToCSV, exportToExcel, docketExportColumns } from "@/utils/exportUtils";
import { Docket, Customer, Office } from "@/types";
import { initialDockets, initialCustomers, initialOffices } from "@/data/initialData";
import { toast } from "@/hooks/use-toast";

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "default";
    case "in_transit":
      return "secondary";
    case "out_for_delivery":
      return "outline";
    case "booked":
      return "outline";
    case "returned":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function Dockets() {
  const [dockets, setDockets] = useLocalStorage<Docket[]>('dockets', initialDockets);
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [offices] = useLocalStorage<Office[]>('offices', initialOffices);
  
  // Use table state hook for search/filter persistence and pagination
  const { search, page, pageSize, setSearch, setPage, setPageSize } = useTableState("dockets");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingDocket, setViewingDocket] = useState<Docket | null>(null);
  const [editingDocket, setEditingDocket] = useState<Docket | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    consigneeName: '',
    consigneePhone: '',
    consigneeAddress: '',
    originOffice: '',
    destinationOffice: '',
    pieces: 1,
    weight: 1,
    volumetricWeight: 0,
    serviceType: 'standard' as 'express' | 'standard' | 'economy',
    paymentMode: 'prepaid' as 'prepaid' | 'topay' | 'credit',
    declaredValue: 0,
    codAmount: 0,
    freight: 0,
    otherCharges: 0,
    status: 'booked' as Docket['status'],
  });

  const filteredDockets = dockets.filter(
    (docket) =>
      docket.customerName.toLowerCase().includes(search.toLowerCase()) ||
      docket.docketNumber.toLowerCase().includes(search.toLowerCase()) ||
      docket.consigneeName.toLowerCase().includes(search.toLowerCase())
  );

  // Paginated data
  const { paginatedData, totalPages, totalItems } = usePaginatedData(filteredDockets, page, pageSize);

  const handleExport = (format: 'csv' | 'excel') => {
    const exportFn = format === 'csv' ? exportToCSV : exportToExcel;
    exportFn(filteredDockets, `dockets-${new Date().toISOString().split('T')[0]}`, docketExportColumns);
    toast({ title: "Success", description: `Exported to ${format.toUpperCase()} successfully` });
  };

  const calculateChargeableWeight = () => {
    return Math.max(formData.weight, formData.volumetricWeight || 0);
  };

  const calculateTotal = () => {
    return formData.freight + formData.otherCharges;
  };

  const openCreateModal = () => {
    setEditingDocket(null);
    setFormData({
      customerId: '',
      consigneeName: '',
      consigneePhone: '',
      consigneeAddress: '',
      originOffice: '',
      destinationOffice: '',
      pieces: 1,
      weight: 1,
      volumetricWeight: 0,
      serviceType: 'standard',
      paymentMode: 'prepaid',
      declaredValue: 0,
      codAmount: 0,
      freight: 0,
      otherCharges: 0,
      status: 'booked',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (docket: Docket) => {
    setEditingDocket(docket);
    setFormData({
      customerId: docket.customerId,
      consigneeName: docket.consigneeName,
      consigneePhone: docket.consigneePhone,
      consigneeAddress: docket.consigneeAddress,
      originOffice: docket.originOffice,
      destinationOffice: docket.destinationOffice,
      pieces: docket.pieces,
      weight: docket.weight,
      volumetricWeight: docket.volumetricWeight || 0,
      serviceType: docket.serviceType,
      paymentMode: docket.paymentMode,
      declaredValue: docket.declaredValue || 0,
      codAmount: docket.codAmount || 0,
      freight: docket.freight,
      otherCharges: docket.otherCharges,
      status: docket.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.consigneeName || !formData.originOffice || !formData.destinationOffice) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    const chargeableWeight = calculateChargeableWeight();
    const totalAmount = calculateTotal();
    const now = new Date().toISOString();

    if (editingDocket) {
      setDockets(dockets.map(d => 
        d.id === editingDocket.id 
          ? { 
              ...d, 
              ...formData,
              customerName: customer?.name || d.customerName,
              chargeableWeight,
              totalAmount,
              updatedAt: now 
            }
          : d
      ));
      toast({ title: "Success", description: "Docket updated successfully" });
    } else {
      const newDocket: Docket = {
        id: generateId(),
        docketNumber: generateNumber('DKT', dockets.map(d => d.docketNumber)),
        customerId: formData.customerId,
        customerName: customer?.name || '',
        consigneeName: formData.consigneeName,
        consigneePhone: formData.consigneePhone,
        consigneeAddress: formData.consigneeAddress,
        originOffice: formData.originOffice,
        destinationOffice: formData.destinationOffice,
        pieces: formData.pieces,
        weight: formData.weight,
        volumetricWeight: formData.volumetricWeight || undefined,
        chargeableWeight,
        serviceType: formData.serviceType,
        paymentMode: formData.paymentMode,
        declaredValue: formData.declaredValue || undefined,
        codAmount: formData.codAmount || undefined,
        freight: formData.freight,
        otherCharges: formData.otherCharges,
        totalAmount,
        status: 'booked',
        currentLocation: formData.originOffice,
        createdAt: now,
        updatedAt: now,
      };
      setDockets([...dockets, newDocket]);
      toast({ title: "Success", description: "Docket created successfully" });
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setDockets(dockets.filter(d => d.id !== deleteId));
      toast({ title: "Success", description: "Docket deleted successfully" });
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dockets</h1>
          <p className="text-muted-foreground">Track and manage shipment dockets</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover">
              <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>Export as Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create Docket
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search dockets..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Docket #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Route</TableHead>
                  <TableHead className="hidden lg:table-cell">Weight</TableHead>
                  <TableHead className="hidden sm:table-cell">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((docket) => (
                  <TableRow key={docket.id}>
                    <TableCell className="font-medium">{docket.docketNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{docket.customerName}</div>
                        <div className="text-sm text-muted-foreground">{docket.consigneeName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {docket.originOffice}
                        <ArrowRight className="h-3 w-3" />
                        {docket.destinationOffice}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {docket.pieces} pcs / {docket.weight} kg
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatCurrency(docket.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(docket.status) as any}>
                        {docket.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => {
                            setViewingDocket(docket);
                            setIsViewModalOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => printDocket(docket)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(docket)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteId(docket.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No dockets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDocket ? 'Edit Docket' : 'Create New Docket'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipper & Consignee */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Shipper & Consignee Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer (Shipper) *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.filter(c => c.status === 'active').map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consigneeName">Consignee Name *</Label>
                  <Input
                    id="consigneeName"
                    value={formData.consigneeName}
                    onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consigneePhone">Consignee Phone *</Label>
                  <Input
                    id="consigneePhone"
                    value={formData.consigneePhone}
                    onChange={(e) => setFormData({ ...formData, consigneePhone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consigneeAddress">Consignee Address *</Label>
                  <Input
                    id="consigneeAddress"
                    value={formData.consigneeAddress}
                    onChange={(e) => setFormData({ ...formData, consigneeAddress: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Route Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originOffice">Origin Office *</Label>
                  <Select
                    value={formData.originOffice}
                    onValueChange={(value) => setFormData({ ...formData, originOffice: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {offices.filter(o => o.status === 'active').map(office => (
                        <SelectItem key={office.id} value={office.name}>
                          {office.name} ({office.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinationOffice">Destination Office *</Label>
                  <Select
                    value={formData.destinationOffice}
                    onValueChange={(value) => setFormData({ ...formData, destinationOffice: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {offices.filter(o => o.status === 'active').map(office => (
                        <SelectItem key={office.id} value={office.name}>
                          {office.name} ({office.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Shipment Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pieces">Pieces</Label>
                  <Input
                    id="pieces"
                    type="number"
                    min="1"
                    value={formData.pieces}
                    onChange={(e) => setFormData({ ...formData, pieces: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volumetricWeight">Vol. Weight (kg)</Label>
                  <Input
                    id="volumetricWeight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.volumetricWeight}
                    onChange={(e) => setFormData({ ...formData, volumetricWeight: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chargeable Weight</Label>
                  <Input
                    value={`${calculateChargeableWeight()} kg`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Service & Payment */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Service & Payment</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value: 'express' | 'standard' | 'economy') => setFormData({ ...formData, serviceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="express">Express</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="economy">Economy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Select
                    value={formData.paymentMode}
                    onValueChange={(value: 'prepaid' | 'topay' | 'credit') => setFormData({ ...formData, paymentMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                      <SelectItem value="topay">To Pay</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="declaredValue">Declared Value</Label>
                  <Input
                    id="declaredValue"
                    type="number"
                    min="0"
                    value={formData.declaredValue}
                    onChange={(e) => setFormData({ ...formData, declaredValue: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codAmount">COD Amount</Label>
                  <Input
                    id="codAmount"
                    type="number"
                    min="0"
                    value={formData.codAmount}
                    onChange={(e) => setFormData({ ...formData, codAmount: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Charges */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Charges</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="freight">Freight</Label>
                  <Input
                    id="freight"
                    type="number"
                    min="0"
                    value={formData.freight}
                    onChange={(e) => setFormData({ ...formData, freight: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCharges">Other Charges</Label>
                  <Input
                    id="otherCharges"
                    type="number"
                    min="0"
                    value={formData.otherCharges}
                    onChange={(e) => setFormData({ ...formData, otherCharges: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <Input
                    value={formatCurrency(calculateTotal())}
                    disabled
                    className="bg-muted font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Status (edit only) */}
            {editingDocket && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Current Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Docket['status']) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="at_hub">At Hub</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDocket ? 'Update' : 'Create'} Docket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Docket Modal with QR */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Docket Details
            </DialogTitle>
          </DialogHeader>
          {viewingDocket && (
            <div className="grid md:grid-cols-[1fr,auto] gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Docket Number</Label>
                    <p className="font-medium">{viewingDocket.docketNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={getStatusColor(viewingDocket.status) as any}>
                      {viewingDocket.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Customer</Label>
                    <p className="font-medium">{viewingDocket.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Consignee</Label>
                    <p className="font-medium">{viewingDocket.consigneeName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Origin</Label>
                    <p className="font-medium">{viewingDocket.originOffice}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Destination</Label>
                    <p className="font-medium">{viewingDocket.destinationOffice}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Pieces</Label>
                    <p className="font-medium">{viewingDocket.pieces}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Weight</Label>
                    <p className="font-medium">{viewingDocket.weight} kg</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Service</Label>
                    <p className="font-medium capitalize">{viewingDocket.serviceType}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Payment Mode</Label>
                    <p className="font-medium capitalize">{viewingDocket.paymentMode}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <p className="font-medium">{formatCurrency(viewingDocket.totalAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <QRCodeDisplay
                  value={viewingDocket.docketNumber}
                  title="Scan to Track"
                  subtitle={viewingDocket.consigneeName}
                  size={120}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the docket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
