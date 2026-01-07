import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Calendar, MapPin, Package, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage, generateId, generateNumber, formatDate } from "@/hooks/useLocalStorage";
import { Pickup, Customer } from "@/types";
import { initialPickups, initialCustomers } from "@/data/initialData";
import { toast } from "@/hooks/use-toast";

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "in_transit":
      return "secondary";
    case "assigned":
      return "outline";
    case "pending":
      return "destructive";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function Pickups() {
  const [pickups, setPickups] = useLocalStorage<Pickup[]>('pickups', initialPickups);
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState<Pickup | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    pickupDate: '',
    pickupTime: '',
    address: '',
    city: '',
    contactPerson: '',
    contactPhone: '',
    expectedPieces: 1,
    expectedWeight: 1,
    vehicleType: 'van' as 'bike' | 'van' | 'truck',
    assignedToName: '',
    status: 'pending' as Pickup['status'],
    remarks: '',
  });

  const filteredPickups = pickups.filter(
    (pickup) =>
      pickup.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickup.pickupNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingPickup(null);
    setFormData({
      customerId: '',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTime: '10:00',
      address: '',
      city: '',
      contactPerson: '',
      contactPhone: '',
      expectedPieces: 1,
      expectedWeight: 1,
      vehicleType: 'van',
      assignedToName: '',
      status: 'pending',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pickup: Pickup) => {
    setEditingPickup(pickup);
    setFormData({
      customerId: pickup.customerId,
      pickupDate: pickup.pickupDate,
      pickupTime: pickup.pickupTime,
      address: pickup.address,
      city: pickup.city,
      contactPerson: pickup.contactPerson,
      contactPhone: pickup.contactPhone,
      expectedPieces: pickup.expectedPieces,
      expectedWeight: pickup.expectedWeight,
      vehicleType: pickup.vehicleType,
      assignedToName: pickup.assignedToName || '',
      status: pickup.status,
      remarks: pickup.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customerId,
        address: customer.address,
        city: customer.city,
        contactPerson: customer.contactPerson,
        contactPhone: customer.phone,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.pickupDate || !formData.address) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    const now = new Date().toISOString();

    if (editingPickup) {
      setPickups(pickups.map(p => 
        p.id === editingPickup.id 
          ? { 
              ...p, 
              ...formData, 
              customerName: customer?.name || p.customerName,
              updatedAt: now 
            }
          : p
      ));
      toast({ title: "Success", description: "Pickup updated successfully" });
    } else {
      const newPickup: Pickup = {
        id: generateId(),
        pickupNumber: generateNumber('PU', pickups.map(p => p.pickupNumber)),
        customerId: formData.customerId,
        customerName: customer?.name || '',
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        address: formData.address,
        city: formData.city,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        expectedPieces: formData.expectedPieces,
        expectedWeight: formData.expectedWeight,
        vehicleType: formData.vehicleType,
        assignedToName: formData.assignedToName || undefined,
        status: formData.assignedToName ? 'assigned' : 'pending',
        remarks: formData.remarks || undefined,
        createdAt: now,
        updatedAt: now,
      };
      setPickups([...pickups, newPickup]);
      toast({ title: "Success", description: "Pickup scheduled successfully" });
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setPickups(pickups.filter(p => p.id !== deleteId));
      toast({ title: "Success", description: "Pickup deleted successfully" });
      setDeleteId(null);
    }
  };

  const markAsComplete = (pickup: Pickup) => {
    setPickups(pickups.map(p => 
      p.id === pickup.id 
        ? { ...p, status: 'completed' as const, updatedAt: new Date().toISOString() }
        : p
    ));
    toast({ title: "Success", description: "Pickup marked as completed" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pickups</h1>
          <p className="text-muted-foreground">Manage pickup requests and schedules</p>
        </div>
        <Button className="gap-2" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Schedule Pickup
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pickups..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pickup #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Schedule</TableHead>
                  <TableHead className="hidden lg:table-cell">Packages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Assigned To</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPickups.map((pickup) => (
                  <TableRow key={pickup.id}>
                    <TableCell className="font-medium">{pickup.pickupNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pickup.customerName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pickup.city}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(pickup.pickupDate)} {pickup.pickupTime}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {pickup.expectedPieces} ({pickup.expectedWeight} kg)
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(pickup.status) as any}>
                        {pickup.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {pickup.assignedToName || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => openEditModal(pickup)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {pickup.status !== 'completed' && pickup.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => markAsComplete(pickup)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteId(pickup.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPickup ? 'Edit Pickup' : 'Schedule New Pickup'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={handleCustomerChange}
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
                <Label htmlFor="pickupDate">Pickup Date *</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupTime">Pickup Time *</Label>
                <Input
                  id="pickupTime"
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Pickup Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value: 'bike' | 'van' | 'truck') => setFormData({ ...formData, vehicleType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedPieces">Expected Pieces</Label>
                <Input
                  id="expectedPieces"
                  type="number"
                  min="1"
                  value={formData.expectedPieces}
                  onChange={(e) => setFormData({ ...formData, expectedPieces: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedWeight">Expected Weight (kg)</Label>
                <Input
                  id="expectedWeight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.expectedWeight}
                  onChange={(e) => setFormData({ ...formData, expectedWeight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedToName}
                  onChange={(e) => setFormData({ ...formData, assignedToName: e.target.value })}
                  placeholder="Driver name"
                />
              </div>
              {editingPickup && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Pickup['status']) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPickup ? 'Update' : 'Schedule'} Pickup
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pickup.
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
