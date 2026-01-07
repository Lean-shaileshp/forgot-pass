import { useState } from "react";
import { Plus, Search, MoreHorizontal, MapPin, User, Edit, Trash2, Eye, CheckCircle, Printer, Download, Mail, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printDeliveryRunSheet } from "@/utils/printUtils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GPSTrackingMap } from "@/components/GPSTrackingMap";
import { EmailPreviewModal } from "@/components/EmailPreviewModal";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useLocalStorage, generateId, generateNumber, formatDate } from "@/hooks/useLocalStorage";
import { useTableState, usePaginatedData } from "@/hooks/useTableState";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { exportToCSV, exportToExcel, truckRunSheetExportColumns } from "@/utils/exportUtils";
import { DeliveryRunSheet, Office, Docket } from "@/types";
import { initialOffices, initialDockets } from "@/data/initialData";
import { toast } from "@/hooks/use-toast";

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
    case "dispatched":
      return "secondary";
    case "created":
      return "outline";
    default:
      return "secondary";
  }
};

const initialDRS: DeliveryRunSheet[] = [
  {
    id: "1",
    drsNumber: "TRS000001",
    date: new Date().toISOString().split("T")[0],
    driverId: "1",
    driverName: "Rahul Sharma",
    vehicleNumber: "MH01AB1234",
    officeId: "1",
    officeName: "Mumbai Hub",
    docketIds: ["1"],
    totalDockets: 5,
    deliveredCount: 3,
    pendingCount: 2,
    returnedCount: 0,
    status: "in_progress",
    createdAt: new Date().toISOString(),
  },
];

export default function DeliveryRunSheetPage() {
  const [deliveryRuns, setDeliveryRuns] = useLocalStorage<DeliveryRunSheet[]>("deliveryRunSheets", initialDRS);
  const [offices] = useLocalStorage<Office[]>("offices", initialOffices);
  const [dockets] = useLocalStorage<Docket[]>("dockets", initialDockets);
  
  // Use table state hook for search/filter persistence and pagination
  const { search, page, pageSize, filters, setSearch, setPage, setPageSize, setFilter } = useTableState("truck-run-sheet");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<any>(null);
  const [editingDRS, setEditingDRS] = useState<DeliveryRunSheet | null>(null);
  const [viewingDRS, setViewingDRS] = useState<DeliveryRunSheet | null>(null);
  const [deletingDRS, setDeletingDRS] = useState<DeliveryRunSheet | null>(null);
  const [selectedTruckId, setSelectedTruckId] = useState<string | undefined>();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    driverName: "",
    vehicleNumber: "",
    officeId: "",
    officeName: "",
    status: "created" as DeliveryRunSheet["status"],
  });

  const statusFilter = filters.status || "all";

  const filteredRuns = deliveryRuns.filter((run) => {
    const matchesSearch =
      run.driverName.toLowerCase().includes(search.toLowerCase()) ||
      run.drsNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginated data
  const { paginatedData, totalPages, totalItems } = usePaginatedData(filteredRuns, page, pageSize);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      driverName: "",
      vehicleNumber: "",
      officeId: "",
      officeName: "",
      status: "created",
    });
    setEditingDRS(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (drs: DeliveryRunSheet) => {
    setEditingDRS(drs);
    setFormData({
      date: drs.date,
      driverName: drs.driverName,
      vehicleNumber: drs.vehicleNumber || "",
      officeId: drs.officeId,
      officeName: drs.officeName,
      status: drs.status,
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (drs: DeliveryRunSheet) => {
    setViewingDRS(drs);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.driverName || !formData.officeId) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    const selectedOffice = offices.find((o) => o.id === formData.officeId);

    if (editingDRS) {
      const updated = deliveryRuns.map((drs) =>
        drs.id === editingDRS.id
          ? {
              ...drs,
              date: formData.date,
              driverName: formData.driverName,
              vehicleNumber: formData.vehicleNumber,
              officeId: formData.officeId,
              officeName: selectedOffice?.name || formData.officeName,
              status: formData.status,
            }
          : drs
      );
      setDeliveryRuns(updated);
      toast({ title: "Success", description: "Truck Run Sheet updated successfully" });
    } else {
      const drsNumber = generateNumber("TRS", deliveryRuns.map((d) => d.drsNumber));
      const newDRS: DeliveryRunSheet = {
        id: generateId(),
        drsNumber,
        date: formData.date,
        driverId: generateId(),
        driverName: formData.driverName,
        vehicleNumber: formData.vehicleNumber,
        officeId: formData.officeId,
        officeName: selectedOffice?.name || "",
        docketIds: [],
        totalDockets: 0,
        deliveredCount: 0,
        pendingCount: 0,
        returnedCount: 0,
        status: "created",
        createdAt: new Date().toISOString(),
      };
      setDeliveryRuns([...deliveryRuns, newDRS]);
      toast({ title: "Success", description: "Truck Run Sheet created successfully" });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const updateStatus = (drs: DeliveryRunSheet, newStatus: DeliveryRunSheet["status"]) => {
    const updated = deliveryRuns.map((d) =>
      d.id === drs.id ? { ...d, status: newStatus } : d
    );
    setDeliveryRuns(updated);
    toast({ title: "Success", description: `Status updated to ${newStatus}` });
  };

  const handleDelete = () => {
    if (deletingDRS) {
      setDeliveryRuns(deliveryRuns.filter((d) => d.id !== deletingDRS.id));
      toast({ title: "Success", description: "Truck Run Sheet deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeletingDRS(null);
    }
  };

  const confirmDelete = (drs: DeliveryRunSheet) => {
    setDeletingDRS(drs);
    setIsDeleteDialogOpen(true);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const exportFn = format === 'csv' ? exportToCSV : exportToExcel;
    exportFn(filteredRuns, `truck-run-sheets-${new Date().toISOString().split('T')[0]}`, truckRunSheetExportColumns);
    toast({ title: "Success", description: `Exported to ${format.toUpperCase()} successfully` });
  };

  const statusCounts = {
    total: deliveryRuns.length,
    inProgress: deliveryRuns.filter((d) => d.status === "in_progress" || d.status === "dispatched").length,
    completed: deliveryRuns.filter((d) => d.status === "completed").length,
    created: deliveryRuns.filter((d) => d.status === "created").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Truck Run Sheet</h1>
          <p className="text-muted-foreground">System record for truck driver assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsMapOpen(!isMapOpen)}>
            <Map className="h-4 w-4" />
            {isMapOpen ? 'Hide Map' : 'GPS Tracking'}
          </Button>
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
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Create Run Sheet
          </Button>
        </div>
      </div>

      {/* GPS Tracking Map */}
      {isMapOpen && (
        <GPSTrackingMap 
          selectedTruckId={selectedTruckId}
          onTruckSelect={(id) => setSelectedTruckId(id)}
        />
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{statusCounts.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.created}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by driver or TRS number..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setFilter('status', v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TRS ID</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="hidden md:table-cell">Office</TableHead>
                  <TableHead className="hidden lg:table-cell">Vehicle</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">{run.drsNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {run.driverName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(run.date)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {run.officeName}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{run.vehicleNumber || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: run.totalDockets > 0
                                ? `${(run.deliveredCount / run.totalDockets) * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {run.deliveredCount}/{run.totalDockets}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(run.status) as any}>
                        {run.status.replace(/_/g, " ")}
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
                          <DropdownMenuItem onClick={() => openViewDialog(run)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(run)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {run.status === "created" && (
                            <DropdownMenuItem onClick={() => updateStatus(run, "dispatched")}>
                              Dispatch
                            </DropdownMenuItem>
                          )}
                          {run.status === "dispatched" && (
                            <DropdownMenuItem onClick={() => updateStatus(run, "in_progress")}>
                              Start Delivery
                            </DropdownMenuItem>
                          )}
                          {run.status === "in_progress" && (
                            <DropdownMenuItem onClick={() => updateStatus(run, "completed")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => printDeliveryRunSheet(run, dockets)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEmailPreviewData({
                              recipientEmail: 'customer@example.com',
                              recipientName: run.driverName,
                              subject: `Delivery Update - ${run.drsNumber}`,
                              trackingNumber: run.drsNumber,
                              details: {
                                'Run Sheet': run.drsNumber,
                                'Driver': run.driverName,
                                'Vehicle': run.vehicleNumber || 'N/A',
                                'Status': run.status.replace(/_/g, ' '),
                                'Dockets': `${run.deliveredCount}/${run.totalDockets} delivered`,
                              }
                            });
                            setIsEmailPreviewOpen(true);
                          }}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Notification
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedTruckId(run.id);
                            setIsMapOpen(true);
                          }}>
                            <Map className="mr-2 h-4 w-4" />
                            Track Location
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => confirmDelete(run)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
                      No truck run sheets found
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDRS ? "Edit Run Sheet" : "Create New Truck Run Sheet"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Office *</Label>
                <Select
                  value={formData.officeId}
                  onValueChange={(value) => setFormData({ ...formData, officeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select office" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Truck Driver Name *</Label>
              <Input
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="Enter truck driver name"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                placeholder="Enter vehicle number"
              />
            </div>
            {editingDRS && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: DeliveryRunSheet["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingDRS ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Truck Run Sheet Details</DialogTitle>
          </DialogHeader>
          {viewingDRS && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{viewingDRS.drsNumber}</span>
                <Badge variant={getStatusColor(viewingDRS.status) as any}>
                  {viewingDRS.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{formatDate(viewingDRS.date)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Office</Label>
                  <p className="font-medium">{viewingDRS.officeName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Truck Driver</Label>
                  <p className="font-medium">{viewingDRS.driverName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">{viewingDRS.vehicleNumber || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center pt-4 border-t">
                <div>
                  <p className="text-xl font-bold">{viewingDRS.totalDockets}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{viewingDRS.deliveredCount}</p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-500">{viewingDRS.pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">{viewingDRS.returnedCount}</p>
                  <p className="text-sm text-muted-foreground">Returned</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the truck run sheet
              {deletingDRS && ` ${deletingDRS.drsNumber}`}.
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

      {/* Email Preview Modal */}
      {emailPreviewData && (
        <EmailPreviewModal
          open={isEmailPreviewOpen}
          onOpenChange={setIsEmailPreviewOpen}
          type="delivery"
          data={emailPreviewData}
        />
      )}
    </div>
  );
}
