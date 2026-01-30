import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { ShipmentTimeline } from '@/components/ShipmentTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, MapPin, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Docket, Manifest } from '@/types';
import { initialDockets, initialManifests } from '@/data/initialData';

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
    case "arrived":
    case "closed":
      return "default";
    case "packed":
    case "picked":
      return "secondary";
    case "in_transit":
    case "dispatched":
    case "at_hub":
      return "secondary";
    case "out_for_delivery":
      return "outline";
    case "booked":
    case "created":
      return "outline";
    case "returned":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "delivered":
    case "arrived":
    case "closed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "packed":
      return <Package className="h-4 w-4 text-blue-500" />;
    case "picked":
      return <MapPin className="h-4 w-4 text-purple-500" />;
    case "in_transit":
    case "dispatched":
      return <Truck className="h-4 w-4 text-blue-500" />;
    case "out_for_delivery":
      return <MapPin className="h-4 w-4 text-orange-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function TrackShipment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  
  const [dockets] = useLocalStorage<Docket[]>('dockets', initialDockets);
  const [manifests] = useLocalStorage<Manifest[]>('manifests', initialManifests);
  
  const [searchResult, setSearchResult] = useState<{
    type: 'docket' | 'manifest';
    data: Docket | Manifest;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleScan = (code: string) => {
    setNotFound(false);
    
    // Search in dockets
    const docket = dockets.find(d => 
      d.docketNumber === code || 
      d.id === code ||
      d.docketNumber.toLowerCase() === code.toLowerCase()
    );
    
    if (docket) {
      setSearchResult({ type: 'docket', data: docket });
      return;
    }
    
    // Search in manifests
    const manifest = manifests.find(m => 
      m.manifestNumber === code || 
      m.id === code ||
      m.manifestNumber.toLowerCase() === code.toLowerCase()
    );
    
    if (manifest) {
      setSearchResult({ type: 'manifest', data: manifest });
      return;
    }
    
    setSearchResult(null);
    setNotFound(true);
  };

  // Auto-search if code provided in URL
  useState(() => {
    if (initialCode) {
      handleScan(initialCode);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Track Shipment</h1>
          <p className="text-muted-foreground">Scan QR code or enter tracking number</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QRCodeScanner 
          onScan={handleScan}
          placeholder="Enter docket or manifest number..."
        />

        {notFound && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">
                No docket or manifest found with that code.
              </p>
            </CardContent>
          </Card>
        )}

        {searchResult && searchResult.type === 'docket' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Docket Details
                </span>
                <Badge variant={getStatusColor((searchResult.data as Docket).status)}>
                  {(searchResult.data as Docket).status.replace('_', ' ')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const docket = searchResult.data as Docket;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Docket Number</p>
                        <p className="font-medium">{docket.docketNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Service Type</p>
                        <p className="font-medium capitalize">{docket.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Origin</p>
                        <p className="font-medium">{docket.originOffice}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Destination</p>
                        <p className="font-medium">{docket.destinationOffice}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Consignee</p>
                        <p className="font-medium">{docket.consigneeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Weight</p>
                        <p className="font-medium">{docket.weight} kg</p>
                      </div>
                    </div>
                    
                    <ShipmentTimeline currentStatus={docket.status} />
                    
                    <QRCodeDisplay
                      value={docket.docketNumber}
                      title="Docket QR Code"
                      subtitle={docket.consigneeName}
                      size={100}
                    />
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {searchResult && searchResult.type === 'manifest' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Manifest Details
                </span>
                <Badge variant={getStatusColor((searchResult.data as Manifest).status)}>
                  {(searchResult.data as Manifest).status.replace('_', ' ')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const manifest = searchResult.data as Manifest;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Manifest Number</p>
                        <p className="font-medium">{manifest.manifestNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{manifest.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Origin</p>
                        <p className="font-medium">{manifest.originOffice}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Destination</p>
                        <p className="font-medium">{manifest.destinationOffice}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vehicle</p>
                        <p className="font-medium">{manifest.vehicleNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dockets</p>
                        <p className="font-medium">{manifest.docketIds.length}</p>
                      </div>
                    </div>
                    
                    <ShipmentTimeline currentStatus={manifest.status} />
                    
                    <QRCodeDisplay
                      value={manifest.manifestNumber}
                      title="Manifest QR Code"
                      subtitle={`${manifest.originOffice} → ${manifest.destinationOffice}`}
                      size={100}
                    />
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
