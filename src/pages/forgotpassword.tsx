import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, AlertCircle, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'mobile' | ''>('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation depending on selected method
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isMobileValid = /^\d{10,}$/.test(mobile.replace(/[\s\-()]/g, ''));

    if (selectedMethod === 'email') {
      if (!isEmailValid) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
    } else if (selectedMethod === 'mobile') {
      if (!isMobileValid) {
        setError('Please enter a valid mobile number');
        setIsLoading(false);
        return;
      }
    } else {
      // if no method selected, accept either if provided
      if (!isEmailValid && !isMobileValid) {
        setError('Please enter a valid email address or mobile number');
        setIsLoading(false);
        return;
      }
    }

    // Simulate API call to send OTP
    try {
      // Here you would call your API to send OTP to the provided contact method
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      setOtpSent(true);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password reset logic here
    alert('Password reset functionality to be implemented');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Truck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Reset Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            {otpSent ? 'Enter the OTP sent to your contact method' : 'Enter your login ID and email/mobile to receive OTP'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleGetOtp} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="loginId">Login ID</Label>
                <Input
                  id="loginId"
                  type="text"
                  placeholder="Enter your login ID"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Choose contact method</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className={`flex-1 rounded-md px-4 py-2 transition-colors ${
                      selectedMethod === 'email'
                        ? 'bg-primary text-primary-foreground hover:opacity-95'
                        : 'bg-white text-foreground border border-border hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMethod(selectedMethod === 'email' ? '' : 'email')}
                  >
                    Email
                  </Button>
                  <Button
                    type="button"
                    className={`flex-1 rounded-md px-4 py-2 transition-colors ${
                      selectedMethod === 'mobile'
                        ? 'bg-primary text-primary-foreground hover:opacity-95'
                        : 'bg-white text-foreground border border-border hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMethod(selectedMethod === 'mobile' ? '' : 'mobile')}
                  >
                    Mobile
                  </Button>
                </div>

                {selectedMethod === 'email' && (
                  <div className="mt-3">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                )}

                {selectedMethod === 'mobile' && (
                  <div className="mt-3">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      type="text"
                      placeholder="Enter your mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Get OTP'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter the 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="bg-background"
                  maxLength={6}
                />
              </div>

              <Button type="submit" className="w-full">
                Verify & Reset Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
