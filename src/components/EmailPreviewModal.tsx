import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { Mail, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency, formatDate } from '@/hooks/useLocalStorage';

interface EmailPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'invoice' | 'delivery';
  data: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    trackingNumber: string;
    details: Record<string, string | number>;
  };
}

export function EmailPreviewModal({ open, onOpenChange, type, data }: EmailPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(generateEmailContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSimulation = () => {
    setSent(true);
    setTimeout(() => {
      onOpenChange(false);
      setSent(false);
    }, 1500);
  };

  const generateEmailContent = () => {
    if (type === 'invoice') {
      return `
Dear ${data.recipientName},

Please find attached your invoice ${data.trackingNumber}.

Invoice Details:
${Object.entries(data.details).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

You can track your shipment using the QR code or tracking number: ${data.trackingNumber}

Thank you for your business!

Best regards,
Logistics Management System
      `.trim();
    }
    return `
Dear ${data.recipientName},

Your shipment ${data.trackingNumber} has been updated.

Delivery Details:
${Object.entries(data.details).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Track your delivery using the QR code below or visit our tracking portal with tracking number: ${data.trackingNumber}

Thank you for choosing our services!

Best regards,
Logistics Management System
    `.trim();
  };

  const trackingUrl = `${window.location.origin}/track?id=${data.trackingNumber}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preview
            <Badge variant="outline" className="ml-2">{type === 'invoice' ? 'Invoice' : 'Delivery Notification'}</Badge>
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
            <p className="text-lg font-medium text-green-600">Email Sent Successfully!</p>
            <p className="text-sm text-muted-foreground">(Simulated - No actual email sent)</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email Header */}
            <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
              <div className="flex gap-2">
                <span className="font-medium w-16">To:</span>
                <span>{data.recipientEmail}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium w-16">Subject:</span>
                <span>{data.subject}</span>
              </div>
            </div>

            {/* Email Body Preview */}
            <div className="border rounded-lg p-6 bg-background">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Dear {data.recipientName},</p>
                
                {type === 'invoice' ? (
                  <p>Please find your invoice <strong>{data.trackingNumber}</strong> details below.</p>
                ) : (
                  <p>Your shipment <strong>{data.trackingNumber}</strong> has been updated with the following details:</p>
                )}

                {/* Details Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(data.details).map(([key, value]) => (
                        <tr key={key} className="border-b last:border-0">
                          <td className="px-4 py-2 bg-muted/50 font-medium w-1/3">{key}</td>
                          <td className="px-4 py-2">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col items-center gap-3 py-4 border rounded-lg bg-muted/20">
                  <p className="text-sm font-medium">Scan to Track</p>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <QRCodeSVG value={trackingUrl} size={120} level="M" />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{data.trackingNumber}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Thank you for your business!<br />
                  <span className="font-medium">Logistics Management System</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {!sent && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Content'}
            </Button>
            <Button onClick={handleSendSimulation}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email (Simulated)
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
