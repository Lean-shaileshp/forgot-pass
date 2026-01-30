import { useState } from "react";
import { Search, MoreHorizontal, Camera, CheckCircle, Clock, Eye, Edit, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useLocalStorage, generateId, formatDate } from "@/hooks/useLocalStorage";
import { POD, Docket } from "@/types";
import { initialDockets } from "@/data/initialData";
import { toast } from "@/hooks/use-toast";

const getStatusColor = (status: string): "default" | "secondary" | "outline" | "destructive" => {
  switch (status) {
    case "delivered":
      return "default";
    case "partial":
      return "secondary";
    case "pending":
      return "outline";
    case "returned":
      return "destructive";
    default:
      return "secondary";
  }
};

const initialPODs: POD[] = [
  {
    id: "1",
    docketId: "1",
    docketNumber: "DKT000001",
    drsId: "1",
    deliveredTo: "Rajesh Kumar",
    relationship: "Self",
    deliveryDate: new Date().toISOString().split("T")[0],
    deliveryTime: "11:30",
    signatureUrl: "signature.png",
    photoUrl: "photo.jpg",
    otpVerified: true,
    status: "delivered",
    createdAt: new Date().toISOString(),
  },
];

export default function PODPage() {
  const [pods, setPods] = useLocalStorage<POD[]>("pods", initialPODs);
  const [dockets] = useLocalStorage<Docket[]>("dockets", initialDockets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPOD, setEditingPOD] = useState<POD | null>(null);
  const [viewingPOD, setViewingPOD] = useState<POD | null>(null);
  const [deletingPOD, setDeletingPOD] = useState<POD | null>(null);

  const [formData, setFormData] = useState({
    docketId: "",
    docketNumber: "",
    deliveredTo: "",
    relationship: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    deliveryTime: "",
    hasSignature: false,
    hasPhoto: false,
    photoFile: null as File | null,
    signatureFile: null as File | null,
    otp: "",
    otpVerified: false,
    remarks: "",
    status: "pending" as POD["status"],
    returnReason: "",
  });

  const filteredPODs = pods.filter((pod) => {
    const matchesSearch =
      pod.docketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pod.deliveredTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || pod.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      docketId: "",
      docketNumber: "",
      deliveredTo: "",
      relationship: "",
      deliveryDate: new Date().toISOString().split("T")[0],
      deliveryTime: "",
      hasSignature: false,
      hasPhoto: false,
      photoFile: null,
      signatureFile: null,
      otp: "",
      otpVerified: false,
      remarks: "",
      status: "pending",
      returnReason: "",
    });
    // Clear file inputs
    const photoInput = document.getElementById('photo-upload') as HTMLInputElement;
    const signatureInput = document.getElementById('signature-upload') as HTMLInputElement;
    const createPhotoInput = document.getElementById('create-photo-upload') as HTMLInputElement;
    const createSignatureInput = document.getElementById('create-signature-upload') as HTMLInputElement;
    if (photoInput) photoInput.value = '';
    if (signatureInput) signatureInput.value = '';
    if (createPhotoInput) createPhotoInput.value = '';
    if (createSignatureInput) createSignatureInput.value = '';
    setEditingPOD(null);
  };

  const openEditDialog = (pod: POD) => {
    setEditingPOD(pod);
    setFormData({
      docketId: pod.docketId,
      docketNumber: pod.docketNumber,
      deliveredTo: pod.deliveredTo,
      relationship: pod.relationship,
      deliveryDate: pod.deliveryDate,
      deliveryTime: pod.deliveryTime,
      hasSignature: !!pod.signatureUrl,
      hasPhoto: !!pod.photoUrl,
      photoFile: null,
      signatureFile: null,
      otp: pod.otp || "",
      otpVerified: pod.otpVerified,
      remarks: pod.remarks || "",
      status: pod.status,
      returnReason: pod.returnReason || "",
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (pod: POD) => {
    setViewingPOD(pod);
    setIsViewDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.docketNumber || !formData.deliveredTo || !formData.deliveryDate) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    try {
      let photoUrl: string | undefined;
      let signatureUrl: string | undefined;

      if (formData.photoFile) {
        photoUrl = await convertFileToBase64(formData.photoFile);
      }

      if (formData.signatureFile) {
        signatureUrl = await convertFileToBase64(formData.signatureFile);
      }

      const newPOD: POD = {
        id: generateId(),
        docketId: formData.docketId,
        docketNumber: formData.docketNumber,
        drsId: formData.docketId, // Using docketId as drsId for simplicity
        deliveredTo: formData.deliveredTo,
        relationship: formData.relationship,
        deliveryDate: formData.deliveryDate,
        deliveryTime: formData.deliveryTime,
        signatureUrl,
        photoUrl,
        otp: formData.otp,
        otpVerified: formData.otpVerified,
        remarks: formData.remarks,
        status: formData.status,
        returnReason: formData.returnReason,
        createdAt: new Date().toISOString(),
      };

      setPods([...pods, newPOD]);
      toast({ title: "Success", description: "POD created successfully" });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload files", variant: "destructive" });
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!formData.deliveredTo || !formData.deliveryDate) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    try {
      let photoUrl = editingPOD?.photoUrl;
      let signatureUrl = editingPOD?.signatureUrl;

      if (formData.photoFile) {
        photoUrl = await convertFileToBase64(formData.photoFile);
      }

      if (formData.signatureFile) {
        signatureUrl = await convertFileToBase64(formData.signatureFile);
      }

      if (editingPOD) {
        const updated = pods.map((p) =>
          p.id === editingPOD.id
            ? {
                ...p,
                deliveredTo: formData.deliveredTo,
                relationship: formData.relationship,
                deliveryDate: formData.deliveryDate,
                deliveryTime: formData.deliveryTime,
                signatureUrl,
                photoUrl,
                otp: formData.otp,
                otpVerified: formData.otpVerified,
                remarks: formData.remarks,
                status: formData.status,
                returnReason: formData.returnReason,
              }
            : p
        );
        setPods(updated);
        toast({ title: "Success", description: "POD updated successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload files", variant: "destructive" });
    }
  };

  const markAsDelivered = (pod: POD) => {
    const updated = pods.map((p) =>
      p.id === pod.id
        ? {
            ...p,
            status: "delivered" as const,
            deliveryDate: new Date().toISOString().split("T")[0],
            deliveryTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          }
        : p
    );
    setPods(updated);
    toast({ title: "Success", description: "POD marked as delivered" });
  };

  const handleDelete = () => {
    if (deletingPOD) {
      setPods(pods.filter((p) => p.id !== deletingPOD.id));
      toast({ title: "Success", description: "POD deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeletingPOD(null);
    }
  };

  const confirmDelete = (pod: POD) => {
    setDeletingPOD(pod);
    setIsDeleteDialogOpen(true);
  };

  const statusCounts = {
    total: pods.length,
    delivered: pods.filter((p) => p.status === "delivered").length,
    pending: pods.filter((p) => p.status === "pending").length,
    returned: pods.filter((p) => p.status === "returned").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proof of Delivery</h1>
          <p className="text-muted-foreground">Manage delivery confirmations and POD documents</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Create POD
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total PODs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{statusCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Returned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusCounts.returned}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search PODs..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Docket No.</TableHead>
                  <TableHead>Delivered To</TableHead>
                  <TableHead className="hidden md:table-cell">Delivered At</TableHead>
                  <TableHead className="hidden sm:table-cell">Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPODs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No PODs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPODs.map((pod) => (
                    <TableRow key={pod.id}>
                      <TableCell className="font-medium">{pod.docketNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pod.deliveredTo}</div>
                          <div className="text-sm text-muted-foreground">{pod.relationship}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pod.status === "delivered" || pod.status === "partial"
                          ? `${formatDate(pod.deliveryDate)} ${pod.deliveryTime}`
                          : "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex gap-2">
                          {pod.signatureUrl ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Signature
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Signature
                            </Badge>
                          )}
                          {pod.photoUrl ? (
                            <Badge variant="outline" className="gap-1">
                              <Camera className="h-3 w-3" />
                              Photo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Camera className="h-3 w-3" />
                              Photo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(pod.status)}>
                          {pod.status}
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
                            <DropdownMenuItem onClick={() => openViewDialog(pod)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(pod)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {pod.status === "pending" && (
                              <DropdownMenuItem onClick={() => markAsDelivered(pod)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Delivered
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => confirmDelete(pod)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit POD - {formData.docketNumber}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4 px-2">
            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>Delivered To *</Label>
                <Input
                  value={formData.deliveredTo}
                  onChange={(e) => setFormData({ ...formData, deliveredTo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  placeholder="e.g., Self, Family, Guard"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>Delivery Time</Label>
                <Input
                  type="time"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: POD["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.status === "returned" && (
              <div className="space-y-2">
                <Label>Return Reason</Label>
                <Input
                  value={formData.returnReason}
                  onChange={(e) => setFormData({ ...formData, returnReason: e.target.value })}
                  placeholder="Enter reason for return"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Additional notes..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Photo</Label>
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="flex items-center gap-2 w-full"
                  >
                    <Camera className="h-4 w-4" />
                    Upload Photo
                  </Button>
                  {formData.photoFile && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ {formData.photoFile.name}
                    </span>
                  )}
                  {editingPOD?.photoUrl && !formData.photoFile && (
                    <span className="text-sm text-blue-600 font-medium">
                      ✓ Current photo exists
                    </span>
                  )}
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, photoFile: e.target.files?.[0] || null })}
                  className="hidden"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Signature</Label>
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('signature-upload')?.click()}
                  className="flex items-center gap-2 w-full"
                >
                  <Upload className="h-4 w-4" />
                  Upload Signature
                </Button>
                {formData.signatureFile && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ {formData.signatureFile.name}
                  </span>
                )}
                {editingPOD?.signatureUrl && !formData.signatureFile && (
                  <span className="text-sm text-blue-600 font-medium">
                    ✓ Current signature exists
                  </span>
                )}
              </div>
              <input
                id="signature-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, signatureFile: e.target.files?.[0] || null })}
                className="hidden"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Update POD</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New POD</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4 px-2">
            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>Docket Number *</Label>
                <Input
                  value={formData.docketNumber}
                  onChange={(e) => setFormData({ ...formData, docketNumber: e.target.value })}
                  placeholder="Enter docket number"
                />
              </div>
              <div className="space-y-2">
                <Label>Docket ID</Label>
                <Input
                  value={formData.docketId}
                  onChange={(e) => setFormData({ ...formData, docketId: e.target.value })}
                  placeholder="Enter docket ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivered To *</Label>
                <Input
                  value={formData.deliveredTo}
                  onChange={(e) => setFormData({ ...formData, deliveredTo: e.target.value })}
                  placeholder="Enter recipient name"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-5">
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  placeholder="e.g., Self, Family, Guard"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Date *</Label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Time</Label>
                <Input
                  type="time"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: POD["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.status === "returned" && (
              <div className="space-y-2">
                <Label>Return Reason</Label>
                <Input
                  value={formData.returnReason}
                  onChange={(e) => setFormData({ ...formData, returnReason: e.target.value })}
                  placeholder="Enter reason for return"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Additional notes..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Photo</Label>
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('create-photo-upload')?.click()}
                    className="flex items-center gap-2 w-full"
                  >
                    <Camera className="h-4 w-4" />
                    Upload Photo
                  </Button>
                  {formData.photoFile && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ {formData.photoFile.name}
                    </span>
                  )}
                </div>
                <input
                  id="create-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, photoFile: e.target.files?.[0] || null })}
                  className="hidden"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Signature</Label>
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('create-signature-upload')?.click()}
                  className="flex items-center gap-2 w-full"
                >
                  <Upload className="h-4 w-4" />
                  Upload Signature
                </Button>
                {formData.signatureFile && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ {formData.signatureFile.name}
                  </span>
                )}
                <input
                  id="create-signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, signatureFile: e.target.files?.[0] || null })}
                  className="hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>OTP</Label>
                <Input
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  placeholder="Enter OTP if verified"
                />
              </div>
              <div className="flex items-center space-x-3 mt-auto">
                <input
                  type="checkbox"
                  id="otp-verified"
                  checked={formData.otpVerified}
                  onChange={(e) => setFormData({ ...formData, otpVerified: e.target.checked })}
                  className="rounded w-4 h-4"
                />
                <Label htmlFor="otp-verified" className="cursor-pointer mb-0">OTP Verified</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create POD</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>POD Details</DialogTitle>
          </DialogHeader>
          {viewingPOD && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Docket Number</Label>
                  <p className="font-medium">{viewingPOD.docketNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getStatusColor(viewingPOD.status)}>
                    {viewingPOD.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Delivered To</Label>
                  <p className="font-medium">{viewingPOD.deliveredTo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Relationship</Label>
                  <p className="font-medium">{viewingPOD.relationship || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Delivery Date</Label>
                  <p className="font-medium">{formatDate(viewingPOD.deliveryDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Delivery Time</Label>
                  <p className="font-medium">{viewingPOD.deliveryTime || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Signature</Label>
                  <Badge variant={viewingPOD.signatureUrl ? "default" : "secondary"}>
                    {viewingPOD.signatureUrl ? "Captured" : "Not Captured"}
                  </Badge>
                  {viewingPOD.signatureUrl && (
                    <img src={viewingPOD.signatureUrl} alt="Signature" className="mt-2 max-w-full h-20 object-contain border rounded" />
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Photo</Label>
                  <Badge variant={viewingPOD.photoUrl ? "default" : "secondary"}>
                    {viewingPOD.photoUrl ? "Captured" : "Not Captured"}
                  </Badge>
                  {viewingPOD.photoUrl && (
                    <img src={viewingPOD.photoUrl} alt="Delivery Photo" className="mt-2 max-w-full h-20 object-contain border rounded" />
                  )}
                </div>
              </div>
              {viewingPOD.otpVerified && (
                <div>
                  <Label className="text-muted-foreground">OTP Verification</Label>
                  <Badge variant="default">Verified</Badge>
                </div>
              )}
              {viewingPOD.remarks && (
                <div>
                  <Label className="text-muted-foreground">Remarks</Label>
                  <p className="font-medium">{viewingPOD.remarks}</p>
                </div>
              )}
              {viewingPOD.returnReason && (
                <div>
                  <Label className="text-muted-foreground">Return Reason</Label>
                  <p className="font-medium text-destructive">{viewingPOD.returnReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete POD</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete POD for "{deletingPOD?.docketNumber}"? This action cannot be undone.
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
