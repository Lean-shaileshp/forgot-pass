import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, RefreshCw, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface GPSLocation {
  lat: number;
  lng: number;
  timestamp: string;
  status: 'moving' | 'stopped' | 'idle';
}

interface TruckLocation {
  id: string;
  drsNumber: string;
  driverName: string;
  vehicleNumber: string;
  currentLocation: GPSLocation;
  route: GPSLocation[];
}

interface GPSTrackingMapProps {
  truckData?: TruckLocation[];
  selectedTruckId?: string;
  onTruckSelect?: (truckId: string) => void;
}

// Default locations for demo (Indian cities)
const DEFAULT_LOCATIONS: TruckLocation[] = [
  {
    id: '1',
    drsNumber: 'TRS000001',
    driverName: 'Rahul Sharma',
    vehicleNumber: 'MH01AB1234',
    currentLocation: { lat: 19.076, lng: 72.8777, timestamp: new Date().toISOString(), status: 'moving' },
    route: [
      { lat: 19.076, lng: 72.8777, timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'moving' },
      { lat: 19.1136, lng: 72.8697, timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'stopped' },
    ]
  },
  {
    id: '2',
    drsNumber: 'TRS000002',
    driverName: 'Amit Kumar',
    vehicleNumber: 'MH02CD5678',
    currentLocation: { lat: 19.2183, lng: 72.9781, timestamp: new Date().toISOString(), status: 'stopped' },
    route: []
  },
];

export function GPSTrackingMap({ truckData, selectedTruckId, onTruckSelect }: GPSTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>(() => 
    localStorage.getItem('mapbox_token') || ''
  );
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [tempToken, setTempToken] = useState(mapboxToken);
  const [isMapReady, setIsMapReady] = useState(false);
  const [trucks, setTrucks] = useState<TruckLocation[]>(truckData || DEFAULT_LOCATIONS);
  const [selectedTruck, setSelectedTruck] = useState<TruckLocation | null>(null);

  const saveToken = () => {
    localStorage.setItem('mapbox_token', tempToken);
    setMapboxToken(tempToken);
    setShowTokenDialog(false);
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [72.8777, 19.076], // Mumbai
        zoom: 11,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        setIsMapReady(true);
        updateMarkers();
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setIsMapReady(false);
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  };

  const updateMarkers = () => {
    if (!map.current || !isMapReady) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for each truck
    trucks.forEach(truck => {
      const el = document.createElement('div');
      el.className = 'truck-marker';
      el.innerHTML = `
        <div style="
          background: ${truck.currentLocation.status === 'moving' ? '#22c55e' : truck.currentLocation.status === 'stopped' ? '#ef4444' : '#f59e0b'};
          padding: 8px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([truck.currentLocation.lng, truck.currentLocation.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <strong>${truck.drsNumber}</strong><br/>
            <span style="color: #666;">${truck.driverName}</span><br/>
            <span style="font-size: 12px;">${truck.vehicleNumber}</span>
          </div>
        `))
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedTruck(truck);
        onTruckSelect?.(truck.id);
      });

      markers.current.push(marker);
    });
  };

  useEffect(() => {
    if (mapboxToken) {
      initializeMap();
    }
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    updateMarkers();
  }, [trucks, isMapReady]);

  useEffect(() => {
    if (selectedTruckId) {
      const truck = trucks.find(t => t.id === selectedTruckId);
      if (truck && map.current) {
        setSelectedTruck(truck);
        map.current.flyTo({
          center: [truck.currentLocation.lng, truck.currentLocation.lat],
          zoom: 14,
        });
      }
    }
  }, [selectedTruckId, trucks]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks(prev => prev.map(truck => ({
        ...truck,
        currentLocation: {
          ...truck.currentLocation,
          lat: truck.currentLocation.lat + (Math.random() - 0.5) * 0.002,
          lng: truck.currentLocation.lng + (Math.random() - 0.5) * 0.002,
          timestamp: new Date().toISOString(),
        }
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!mapboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Tracking Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <MapPin className="h-16 w-16 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Mapbox token required for real-time GPS tracking
            </p>
            <Button onClick={() => setShowTokenDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Mapbox Token
            </Button>
            <p className="text-xs text-muted-foreground">
              Get your free token at <a href="https://mapbox.com" target="_blank" rel="noopener" className="text-primary underline">mapbox.com</a>
            </p>
          </div>

          <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Mapbox Token</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Mapbox Public Token</Label>
                  <Input
                    placeholder="pk.eyJ1..."
                    value={tempToken}
                    onChange={(e) => setTempToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    1. Go to <a href="https://mapbox.com" target="_blank" rel="noopener" className="text-primary underline">mapbox.com</a> and create a free account<br/>
                    2. Find your public token in the Tokens section<br/>
                    3. Paste it here
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTokenDialog(false)}>Cancel</Button>
                <Button onClick={saveToken} disabled={!tempToken}>Save Token</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Tracking Map
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTokenDialog(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={updateMarkers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div ref={mapContainer} className="h-[400px] w-full rounded-b-lg" />
          
          {/* Truck List Overlay */}
          <div className="absolute top-2 left-2 bg-background/95 rounded-lg shadow-lg p-3 max-w-[200px] max-h-[350px] overflow-y-auto">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Active Trucks</p>
            <div className="space-y-2">
              {trucks.map(truck => (
                <button
                  key={truck.id}
                  onClick={() => {
                    setSelectedTruck(truck);
                    map.current?.flyTo({
                      center: [truck.currentLocation.lng, truck.currentLocation.lat],
                      zoom: 14,
                    });
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors ${
                    selectedTruck?.id === truck.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      truck.currentLocation.status === 'moving' ? 'bg-green-500' :
                      truck.currentLocation.status === 'stopped' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs font-medium">{truck.drsNumber}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{truck.driverName}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Truck Info */}
          {selectedTruck && (
            <div className="absolute bottom-2 right-2 bg-background/95 rounded-lg shadow-lg p-3 max-w-[250px]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{selectedTruck.drsNumber}</span>
                <Badge variant={
                  selectedTruck.currentLocation.status === 'moving' ? 'default' :
                  selectedTruck.currentLocation.status === 'stopped' ? 'destructive' : 'secondary'
                }>
                  {selectedTruck.currentLocation.status}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Driver:</span> {selectedTruck.driverName}</p>
                <p><span className="text-muted-foreground">Vehicle:</span> {selectedTruck.vehicleNumber}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  {selectedTruck.currentLocation.lat.toFixed(4)}, {selectedTruck.currentLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Mapbox Token</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mapbox Public Token</Label>
              <Input
                placeholder="pk.eyJ1..."
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTokenDialog(false)}>Cancel</Button>
            <Button onClick={saveToken}>Save Token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
