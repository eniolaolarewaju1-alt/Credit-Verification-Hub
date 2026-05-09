import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Smartphone, Monitor, Globe, KeyRound, Fingerprint, Activity } from "lucide-react";

export default function Security() {
  
  const recentLogins = [
    { id: 1, device: "iPhone 14 Pro", os: "iOS 17", location: "Charleston, SC", time: "Today, 10:42 AM", current: true },
    { id: 2, device: "MacBook Air", os: "macOS Sonoma", location: "Charleston, SC", time: "Yesterday, 8:15 PM", current: false },
    { id: 3, device: "Chrome Browser", os: "Windows 11", location: "Atlanta, GA", time: "Oct 12, 2:30 PM", current: false },
  ];

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-primary" data-testid="text-page-title">Security Center</h1>
        <p className="text-muted-foreground mt-1">Keep your account safe and monitor activity.</p>
      </div>

      {/* Security Status Banner */}
      <div className="bg-success/10 border border-success/30 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-success-foreground">Your account is secure</h2>
            <p className="text-sm text-success-foreground/80 mt-1">We haven't detected any unusual activity on your account. Two-factor authentication is enabled.</p>
          </div>
        </div>
        <Button variant="outline" className="border-success/30 text-success-foreground hover:bg-success/20 shrink-0">
          Run Security Check
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" /> Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                  <h3 className="font-medium text-foreground">Password</h3>
                  <p className="text-sm text-muted-foreground mt-1">Last changed 4 months ago. We recommend changing it every 6 months.</p>
                </div>
                <Button variant="outline">Update</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                    <Badge variant="default" className="bg-success">Enabled</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Code sent via SMS to (***) ***-1234.</p>
                </div>
                <Button variant="outline">Manage</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Recent Sign-ins
              </CardTitle>
              <CardDescription>Review devices that have accessed your account recently.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {recentLogins.map(login => (
                  <div key={login.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-muted-foreground shrink-0">
                        {login.device.includes("iPhone") || login.device.includes("Mobile") ? (
                          <Smartphone className="w-5 h-5" />
                        ) : (
                          <Monitor className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{login.device}</p>
                          {login.current && <Badge variant="secondary" className="text-[10px]">Current Device</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{login.os}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {login.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                      <p className="text-sm text-muted-foreground">{login.time}</p>
                      {!login.current && (
                        <button className="text-xs text-primary font-medium hover:underline sm:mt-1">
                          Not you?
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center border-t border-border pt-4">
                <Button variant="ghost" className="text-primary w-full">Sign out of all other devices</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Tips */}
        <div className="space-y-6">
          <Card className="shadow-sm border-border bg-sidebar text-sidebar-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <ShieldAlert className="w-5 h-5" /> Security Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-sidebar-accent/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-1">Beware of Phishing</h4>
                <p className="text-sm text-sidebar-foreground/80">Heritage Credit Union will never ask for your password via email, text, or phone call.</p>
              </div>
              <div className="bg-sidebar-accent/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-1 flex items-center gap-2"><Fingerprint className="w-4 h-4"/> Use Biometrics</h4>
                <p className="text-sm text-sidebar-foreground/80">Enable Face ID or Fingerprint login on the mobile app for faster, more secure access.</p>
              </div>
              <div className="bg-sidebar-accent/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-1">Unique Passwords</h4>
                <p className="text-sm text-sidebar-foreground/80">Don't reuse passwords across different sites. Use a password manager to keep track.</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
