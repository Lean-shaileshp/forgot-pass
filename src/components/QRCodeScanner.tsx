import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, X, Search, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRCodeScannerProps {
  onScan: (value: string) => void;
  placeholder?: string;
}

export function QRCodeScanner({ onScan, placeholder = "Enter code manually..." }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  const startScanner = async () => {
    setIsScanning(true);
    
    // Wait for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {} // Ignore errors during scanning
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Scan or Enter Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
            />
            <Button variant="outline" size="icon" onClick={handleManualSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={startScanner}
          >
            <Camera className="h-4 w-4 mr-2" />
            Scan QR Code
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isScanning} onOpenChange={(open) => !open && stopScanner()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scanning QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div 
              id={scannerContainerId} 
              className="w-full aspect-square rounded-lg overflow-hidden bg-muted"
            />
            <Button variant="outline" className="w-full" onClick={stopScanner}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
