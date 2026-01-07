import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  title: string;
  subtitle?: string;
  size?: number;
}

export function QRCodeDisplay({ value, title, subtitle, size = 128 }: QRCodeDisplayProps) {
  const downloadQR = () => {
    const svg = document.getElementById(`qr-${value}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = size * 2;
    canvas.height = size * 2;
    
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, size * 2, size * 2);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${title}-${value}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Card className="w-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="bg-white p-2 rounded-lg">
          <QRCodeSVG
            id={`qr-${value}`}
            value={value}
            size={size}
            level="M"
            includeMargin={false}
          />
        </div>
        <p className="text-xs font-mono text-muted-foreground">{value}</p>
        <Button variant="outline" size="sm" onClick={downloadQR}>
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      </CardContent>
    </Card>
  );
}
