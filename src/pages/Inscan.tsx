import { useState } from "react";
import { Search, Package, Scan, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useLocalStorage, generateId, generateNumber } from "@/hooks/useLocalStorage";
import { Inscan, Manifest, Docket, Office } from "@/types";
import { initialManifests, initialDockets, initialOffices } from "@/data/initialData";
import { toast } from "@/hooks/use-toast";

interface InscanItem {
  docketId: string;
  docketNumber: string;
  origin: string;
  weight: number;
  pieces: number;
  scannedAt?: string;
  status: "pending" | "scanned" | "damaged" | "short";
  remarks?: string;
}

export default function InscanPage() {
  const [inscans, setInscans] = useLocalStorage<Inscan[]>("inscans", []);
  const [manifests] = useLocalStorage<Manifest[]>("manifests", initialManifests);
  const [dockets, setDockets] = useLocalStorage<Docket[]>("dockets", initialDockets);
  const [offices] = useLocalStorage<Office[]>("offices", initialOffices);
  
  const [selectedManifest, setSelectedManifest] = useState<Manifest | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [inscanItems, setInscanItems] = useState<InscanItem[]>([]);
  const [isManifestDialogOpen, setIsManifestDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");

  const arrivedManifests = manifests.filter((m) => m.status === "arrived" || m.status === "in_transit");
  
  const scannedCount = inscanItems.filter((item) => item.status === "scanned").length;
  const damagedCount = inscanItems.filter((item) => item.status === "damaged").length;
  const pendingCount = inscanItems.filter((item) => item.status === "pending").length;

  const selectManifest = (manifestId: string) => {
    const manifest = manifests.find((m) => m.id === manifestId);
    if (manifest) {
      setSelectedManifest(manifest);
      // Load dockets from manifest
      const manifestDockets = dockets.filter((d) => manifest.docketIds.includes(d.id));
      const items: InscanItem[] = manifestDockets.map((d) => ({
        docketId: d.id,
        docketNumber: d.docketNumber,
        origin: d.originOffice,
        weight: d.weight,
        pieces: d.pieces,
        status: "pending",
      }));
      
      // If no dockets linked, create sample items
      if (items.length === 0) {
        const sampleItems: InscanItem[] = [
          { docketId: "1", docketNumber: "DKT000001", origin: manifest.originOffice, weight: 15, pieces: 3, status: "pending" },
          { docketId: "2", docketNumber: "DKT000002", origin: manifest.originOffice, weight: 25, pieces: 5, status: "pending" },
          { docketId: "3", docketNumber: "DKT000003", origin: manifest.originOffice, weight: 10, pieces: 2, status: "pending" },
        ];
        setInscanItems(sampleItems);
      } else {
        setInscanItems(items);
      }
      setIsManifestDialogOpen(false);
    }
  };

  const handleScan = () => {
    if (!scanInput.trim()) return;

    const itemIndex = inscanItems.findIndex(
      (item) => item.docketNumber.toLowerCase() === scanInput.toLowerCase()
    );

    if (itemIndex >= 0) {
      const updated = [...inscanItems];
      if (updated[itemIndex].status === "pending") {
        updated[itemIndex].status = "scanned";
        updated[itemIndex].scannedAt = new Date().toLocaleTimeString();
        setInscanItems(updated);
        toast({ title: "Success", description: `Docket ${scanInput} scanned successfully` });
      } else {
        toast({ title: "Info", description: `Docket ${scanInput} already scanned`, variant: "default" });
      }
    } else {
      toast({ title: "Error", description: `Docket ${scanInput} not found in manifest`, variant: "destructive" });
    }

    setScanInput("");
  };

  const markAsDamaged = (item: InscanItem) => {
    const updated = inscanItems.map((i) =>
      i.docketId === item.docketId ? { ...i, status: "damaged" as const, scannedAt: new Date().toLocaleTimeString() } : i
    );
    setInscanItems(updated);
    toast({ title: "Marked as Damaged", description: `Docket ${item.docketNumber} marked as damaged` });
  };

  const resetItem = (item: InscanItem) => {
    const updated = inscanItems.map((i) =>
      i.docketId === item.docketId ? { ...i, status: "pending" as const, scannedAt: undefined } : i
    );
    setInscanItems(updated);
  };

  const completeInscan = () => {
    if (!selectedManifest) return;

    const newInscan: Inscan = {
      id: generateId(),
      inscanNumber: generateNumber("INS", inscans.map((i) => i.inscanNumber)),
      manifestId: selectedManifest.id,
      manifestNumber: selectedManifest.manifestNumber,
      officeId: "1",
      officeName: selectedManifest.destinationOffice,
      receivedBy: "Admin",
      receivedAt: new Date().toISOString(),
      expectedDockets: inscanItems.length,
      scannedDockets: scannedCount,
      shortDockets: inscanItems.filter((i) => i.status === "pending").map((i) => i.docketNumber),
      damagedDockets: inscanItems.filter((i) => i.status === "damaged").map((i) => i.docketNumber),
      status: pendingCount > 0 ? "discrepancy" : "completed",
      remarks,
    };

    setInscans([...inscans, newInscan]);
    
    // Update docket locations
    const updatedDockets = dockets.map((d) => {
      const scannedItem = inscanItems.find((i) => i.docketId === d.id && i.status === "scanned");
      if (scannedItem) {
        return { ...d, currentLocation: selectedManifest.destinationOffice, status: "at_hub" as const };
      }
      return d;
    });
    setDockets(updatedDockets);

    toast({ title: "Success", description: "Inscan completed successfully" });
    setIsCompleteDialogOpen(false);
    setSelectedManifest(null);
    setInscanItems([]);
    setRemarks("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inscan</h1>
          <p className="text-muted-foreground">Scan incoming shipments from manifests</p>
        </div>
        {!selectedManifest && (
          <Button onClick={() => setIsManifestDialogOpen(true)}>Select Manifest</Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Manifest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedManifest?.manifestNumber || "None Selected"}
            </div>
            {selectedManifest && (
              <p className="text-sm text-muted-foreground">
                {selectedManifest.originOffice} → {selectedManifest.destinationOffice}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scan Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scannedCount} / {inscanItems.length}</div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: inscanItems.length > 0 ? `${(scannedCount / inscanItems.length) * 100}%` : "0%" }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Damaged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{damagedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scan Docket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Scan or enter docket ID..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                className="flex-1"
                disabled={!selectedManifest}
              />
              <Button size="icon" onClick={handleScan} disabled={!selectedManifest}>
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Dockets to Scan</CardTitle>
              <CardDescription>
                {selectedManifest
                  ? `Items from manifest ${selectedManifest.manifestNumber}`
                  : "Select a manifest to begin scanning"}
              </CardDescription>
            </div>
            {selectedManifest && scannedCount > 0 && (
              <Button onClick={() => setIsCompleteDialogOpen(true)}>
                Complete Inscan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Docket No.</TableHead>
                  <TableHead className="hidden md:table-cell">Origin</TableHead>
                  <TableHead className="hidden lg:table-cell">Weight</TableHead>
                  <TableHead>Packages</TableHead>
                  <TableHead className="hidden sm:table-cell">Scanned At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscanItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {selectedManifest ? "No dockets in this manifest" : "Select a manifest to view dockets"}
                    </TableCell>
                  </TableRow>
                ) : (
                  inscanItems.map((item) => (
                    <TableRow key={item.docketId}>
                      <TableCell className="font-medium">{item.docketNumber}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.origin}</TableCell>
                      <TableCell className="hidden lg:table-cell">{item.weight} kg</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {item.pieces}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{item.scannedAt || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "scanned"
                              ? "default"
                              : item.status === "damaged"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.status === "pending" ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => {
                                setScanInput(item.docketNumber);
                                handleScan();
                              }}
                            >
                              <Scan className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive"
                              onClick={() => markAsDamaged(item)}
                            >
                              <AlertCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 items-center">
                            {item.status === "scanned" && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resetItem(item)}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Select Manifest Dialog */}
      <Dialog open={isManifestDialogOpen} onOpenChange={setIsManifestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Manifest for Inscan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Manifest</Label>
              <Select onValueChange={selectManifest}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a manifest" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {arrivedManifests.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No manifests available
                    </SelectItem>
                  ) : (
                    arrivedManifests.map((manifest) => (
                      <SelectItem key={manifest.id} value={manifest.id}>
                        {manifest.manifestNumber} - {manifest.originOffice} → {manifest.destinationOffice}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Inscan Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Inscan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{scannedCount}</p>
                <p className="text-sm text-muted-foreground">Scanned</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{damagedCount}</p>
                <p className="text-sm text-muted-foreground">Damaged</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Short</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <div className="p-3 bg-destructive/10 rounded-lg text-sm">
                <p className="font-medium text-destructive">Discrepancy Detected</p>
                <p className="text-muted-foreground">
                  {pendingCount} docket(s) not scanned. They will be marked as short.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={completeInscan}>Complete Inscan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
