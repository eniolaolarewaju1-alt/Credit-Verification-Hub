import { useGetMember } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Building, Shield } from "lucide-react";

export default function Settings() {
  const { data: member, isLoading } = useGetMember();

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-primary" data-testid="text-page-title">Settings & Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-lg font-medium text-foreground">Personal Info</h2>
          <p className="text-sm text-muted-foreground">Your core identity details associated with your Heritage Credit Union membership.</p>
        </div>
        
        <Card className="md:col-span-2 shadow-sm border-border bg-white">
          <CardContent className="p-6">
            {isLoading || !member ? (
              <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <div className="w-16 h-16 rounded-full bg-sidebar text-sidebar-foreground flex items-center justify-center text-xl font-bold">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">{member.firstName} {member.lastName}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Shield className="w-3.5 h-3.5" /> Member #{member.memberNumber}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Email Address</Label>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Mail className="w-4 h-4 text-muted-foreground" /> {member.email}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Phone Number</Label>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Phone className="w-4 h-4 text-muted-foreground" /> {member.phone}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Mailing Address</Label>
                    <div className="flex items-start gap-2 text-foreground font-medium">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p>{member.address}</p>
                        <p>{member.city}, {member.state} {member.zip}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Membership Status</Label>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Building className="w-4 h-4 text-muted-foreground" /> 
                        <span className="capitalize">{member.status} since {new Date(member.memberSince).getFullYear()}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit Profile</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="col-span-1 md:col-span-3 my-2" />

        <div className="md:col-span-1 space-y-2">
          <h2 className="text-lg font-medium text-foreground">Contact Preferences</h2>
          <p className="text-sm text-muted-foreground">Control how we communicate with you about your accounts and offers.</p>
        </div>

        <Card className="md:col-span-2 shadow-sm border-border bg-white">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about suspicious logins or large transfers.</p>
                </div>
                <Switch defaultChecked disabled className="opacity-50" />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Paperless Statements</Label>
                  <p className="text-sm text-muted-foreground">Receive statements electronically instead of by mail.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Marketing Offers</Label>
                  <p className="text-sm text-muted-foreground">Receive updates on new loan rates and credit card offers.</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
