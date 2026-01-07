import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, FileText, Truck, Edit, Trash2, Eye, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printManifest } from "@/utils/printUtils";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Manifest, Office, Docket } from "@/types";
import { initialManifests, initialOffices, initialDockets } from "@/data/initialData";
import { toast } from "@/hooks/use-toast";

const getStatusColor = (status: string) => {
  switch (status) {
    case "closed":
    case "arrived":
      return "default";
    case "in_transit":
    case "dispatched":
      return "secondary";
    case "created":
      return "outline";
    default:
      return "secondary";
  }
};

export default function Manifests() {
  const [manifests, setManifests] = useLocalStorage<Manifest[]>("manifests", initialManifests);
  const [offices] = useLocalStorage<Office[]>("offices", initialOffices);
  const [dockets] = useLocalStorage<Docket[]>("dockets", initialDockets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingManifest, setEditingManifest] = useState<Manifest | null>(null);
  const [viewingManifest, setViewingManifest] = useState<Manifest | null>(null);
  const [deletingManifest, setDeletingManifest] = useState<Manifest | null>(null);

  const [formData, setFormData] = useState({
    type: "outbound" as Manifest["type"],
    originOffice: "",
    destinationOffice: "",
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    dispatchDate: "",
    expectedArrival: "",
    status: "created" as Manifest["status"],
  });

  const filteredManifests = manifests.filter((manifest) => {
    const matchesSearch =
      manifest.manifestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manifest.originOffice.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || manifest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      type: "outbound",
      originOffice: "",
      destinationOffice: "",
      vehicleNumber: "",
      driverName: "",
      driverPhone: "",
      dispatchDate: "",
      expectedArrival: "",
      status: "created",
    });
    setEditingManifest(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (manifest: Manifest) => {
    setEditingManifest(manifest);
    setFormData({
      type: manifest.type,
      originOffice: manifest.originOffice,
      destinationOffice: manifest.destinationOffice,
      vehicleNumber: manifest.vehicleNumber || "",
      driverName: manifest.driverName || "",
      driverPhone: manifest.driverPhone || "",
      dispatchDate: manifest.dispatchDate.split("T")[0],
      expectedArrival: manifest.expectedArrival?.split("T")[0] || "",
      status: manifest.status,
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (manifest: Manifest) => {
    setViewingManifest(manifest);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.originOffice || !formData.destinationOffice) {
      toast({ title: "Error", description: "Please select origin and destination", variant: "destructive" });
      return;
    }

    if (editingManifest) {
      const updated = manifests.map((m) =>
        m.id === editingManifest.id
          ? {
              ...m,
              ...formData,
              dispatchDate: new Date(formData.dispatchDate).toISOString(),
              expectedArrival: formData.expectedArrival ? new Date(formData.expectedArrival).toISOString() : undefined,
            }
          : m
      );
      setManifests(updated);
      toast({ title: "Success", description: "Manifest updated successfully" });
    } else {
      const manifestNumber = generateNumber("MAN", manifests.map((m) => m.manifestNumber));
      const newManifest: Manifest = {
        id: generateId(),
        manifestNumber,
        ...formData,
        docketIds: [],
        docketCount: 0,
        totalPieces: 0,
        totalWeight: 0,
        dispatchDate: new Date(formData.dispatchDate).toISOString(),
        expectedArrival: formData.expectedArrival ? new Date(formData.expectedArrival).toISOString() : undefined,
        createdBy: "Admin",
        createdAt: new Date().toISOString(),
      };
      setManifests([...manifests, newManifest]);
      toast({ title: "Success", description: "Manifest created successfully" });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const updateStatus = (manifest: Manifest, newStatus: Manifest["status"]) => {
    const updated = manifests.map((m) =>
      m.id === manifest.id
        ? {
            ...m,
            status: newStatus,
            actualArrival: newStatus === "arrived" ? new Date().toISOString() : m.actualArrival,
          }
        : m
    );
    setManifests(updated);
    toast({ title: "Success", description: `Manifest status updated to ${newStatus}` });
  };

  const handleDelete = () => {
    if (deletingManifest) {
      setManifests(manifests.filter((m) => m.id !== deletingManifest.id));
      toast({ title: "Success", description: "Manifest deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeletingManifest(null);
    }
  };

  const confirmDelete = (manifest: Manifest) => {
    setDeletingManifest(manifest);
    setIsDeleteDialogOpen(true);
  };

  const statusCounts = {
    total: manifests.length,
    created: manifests.filter((m) => m.status === "created").length,
    inTransit: manifests.filter((m) => m.status === "in_transit" || m.status === "dispatched").length,
    arrived: manifests.filter((m) => m.status === "arrived" || m.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manifests</h1>
          <p className="text-muted-foreground">Manage shipment manifests and vehicle loading</p>
        </div>
        <Button className="gap-2" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Create Manifest
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Manifests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.created}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{statusCounts.inTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arrived/Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.arrived}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search manifests..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manifest ID</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                  <TableHead className="hidden lg:table-cell">Dockets</TableHead>
                  <TableHead className="hidden sm:table-cell">Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManifests.map((manifest) => (
                  <TableRow key={manifest.id}>
                    <TableCell className="font-medium">{manifest.manifestNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{manifest.originOffice}</div>
                        <div className="text-sm text-muted-foreground">→ {manifest.destinationOffice}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {manifest.vehicleNumber || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {manifest.docketCount}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{manifest.totalWeight} kg</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(manifest.status) as any}>
                        {manifest.status.replace(/_/g, " ")}
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
                          <DropdownMenuItem onClick={() => openViewDialog(manifest)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(manifest)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {manifest.status === "created" && (
                            <DropdownMenuItem onClick={() => updateStatus(manifest, "dispatched")}>
                              Dispatch
                            </DropdownMenuItem>
                          )}
                          {manifest.status === "dispatched" && (
                            <DropdownMenuItem onClick={() => updateStatus(manifest, "in_transit")}>
                              Mark In Transit
                            </DropdownMenuItem>
                          )}
                          {manifest.status === "in_transit" && (
                            <DropdownMenuItem onClick={() => updateStatus(manifest, "arrived")}>
                              Mark Arrived
                            </DropdownMenuItem>
                          )}
                          {manifest.status === "arrived" && (
                            <DropdownMenuItem onClick={() => updateStatus(manifest, "closed")}>
                              Close Manifest
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => printManifest(manifest, dockets)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => confirmDelete(manifest)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingManifest ? "Edit Manifest" : "Create New Manifest"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Manifest["type"]) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Manifest["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="arrived">Arrived</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origin Office *</Label>
                <Select
                  value={formData.originOffice}
                  onValueChange={(value) => setFormData({ ...formData, originOffice: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.name}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination Office *</Label>
                <Select
                  value={formData.destinationOffice}
                  onValueChange={(value) => setFormData({ ...formData, destinationOffice: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.name}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Phone</Label>
                <Input
                  value={formData.driverPhone}
                  onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dispatch Date</Label>
                <Input
                  type="date"
                  value={formData.dispatchDate}
                  onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Arrival</Label>
                <Input
                  type="date"
                  value={formData.expectedArrival}
                  onChange={(e) => setFormData({ ...formData, expectedArrival: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingManifest ? "Update" : "Create"} Manifest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Manifest Details
            </DialogTitle>
          </DialogHeader>
          {viewingManifest && (
            <div className="grid md:grid-cols-[1fr,auto] gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Manifest Number</Label>
                    <p className="font-medium">{viewingManifest.manifestNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={getStatusColor(viewingManifest.status) as any}>
                      {viewingManifest.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Origin</Label>
                    <p className="font-medium">{viewingManifest.originOffice}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Destination</Label>
                    <p className="font-medium">{viewingManifest.destinationOffice}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Vehicle</Label>
                    <p className="font-medium">{viewingManifest.vehicleNumber || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Driver</Label>
                    <p className="font-medium">{viewingManifest.driverName || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Driver Phone</Label>
                    <p className="font-medium">{viewingManifest.driverPhone || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Dockets</Label>
                    <p className="font-medium">{viewingManifest.docketCount}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Pieces</Label>
                    <p className="font-medium">{viewingManifest.totalPieces}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Weight</Label>
                    <p className="font-medium">{viewingManifest.totalWeight} kg</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Dispatch Date</Label>
                    <p className="font-medium">{formatDate(viewingManifest.dispatchDate)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Expected Arrival</Label>
                    <p className="font-medium">
                      {viewingManifest.expectedArrival ? formatDate(viewingManifest.expectedArrival) : "-"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <QRCodeDisplay
                  value={viewingManifest.manifestNumber}
                  title="Scan to Track"
                  subtitle={`${viewingManifest.originOffice} → ${viewingManifest.destinationOffice}`}
                  size={120}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Manifest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingManifest?.manifestNumber}"? This action cannot be undone.
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
