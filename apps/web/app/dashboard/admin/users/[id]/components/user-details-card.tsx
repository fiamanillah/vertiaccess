'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import { Badge } from '@workspace/ui/components/badge';
import { formatDate } from '@/lib/format-date';
import { User, Mail, Building2, Calendar, Clock, Shield, Phone, Tag } from 'lucide-react';

interface UserDetailsCardProps {
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    displayName: string;
    organisation?: string;
    contactPhone?: string;
    flyerId?: string;
    status: string;
    lastLogin?: string | null;
    createdAt: string;
  };
}

export default function UserDetailsCard({ user }: UserDetailsCardProps) {
  // Format role for display
  const displayRole =
    user.role === 'assetmanager'
      ? 'Asset Manager'
      : user.role === 'operator'
      ? 'Operator'
      : user.role === 'admin'
      ? 'Admin'
      : user.role;

  return (
    <Card className="border shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center gap-4 bg-muted/10 pb-4">
        <Avatar className="h-14 w-14 border-2 border-primary/10 shadow-sm">
          <AvatarFallback className="text-base bg-primary/10 text-primary font-bold">
            {user.firstName?.[0] || 'U'}
            {user.lastName?.[0] || ''}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">{user.displayName}</CardTitle>
          <CardDescription className="text-sm">{user.email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Personal Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Tag className="h-4 w-4 text-muted-foreground/75 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground/60 font-medium">User ID / SUB</div>
                <span className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded break-all">
                  {user.id}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <User className="h-4 w-4 text-muted-foreground/75 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground/60 font-medium">Full Name</div>
                <span className="font-medium text-foreground">{user.firstName} {user.lastName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="h-4 w-4 text-muted-foreground/75 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground/60 font-medium">Email Address</div>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Building2 className="h-4 w-4 text-muted-foreground/75 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground/60 font-medium">Organisation</div>
                <span className="font-medium text-foreground">
                  {user.organisation || <span className="text-muted-foreground/60 italic">N/A</span>}
                </span>
              </div>
            </div>

            {user.contactPhone && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="h-4 w-4 text-muted-foreground/75 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground/60 font-medium">Contact Phone</div>
                  <span className="font-medium text-foreground">{user.contactPhone}</span>
                </div>
              </div>
            )}

            {user.role === 'operator' && user.flyerId && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Shield className="h-4 w-4 text-muted-foreground/75 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground/60 font-medium">Flyer ID</div>
                  <span className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">
                    {user.flyerId}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="border-border/60" />

        <div>
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Account Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Shield className="h-4 w-4 text-muted-foreground/75 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground/60 font-medium">Account Type</div>
                <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'assetmanager' ? 'default' : 'secondary'} className="mt-0.5 capitalize font-semibold">
                  {displayRole}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Clock className="h-4 w-4 text-muted-foreground/75 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground/60 font-medium">Account Status</div>
                <Badge
                  variant="outline"
                  className={`mt-0.5 capitalize font-semibold ${
                    user.status === 'active'
                      ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                      : user.status === 'pending_verification'
                      ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                      : user.status === 'suspended'
                      ? 'border-red-500 text-red-500 bg-red-500/10'
                      : user.status === 'payment_locked'
                      ? 'border-orange-500 text-orange-500 bg-orange-500/10'
                      : 'border-muted-foreground text-muted-foreground bg-muted'
                  }`}
                >
                  {user.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground/75 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground/60 font-medium">Created At</div>
                <span className="font-semibold text-foreground">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                  })} at {new Date(user.createdAt).toLocaleTimeString(undefined, {
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Clock className="h-4 w-4 text-muted-foreground/75 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground/60 font-medium">Last Login</div>
                <span className="font-semibold text-foreground">
                  {user.lastLogin ? formatDate(user.lastLogin) : <span className="text-muted-foreground/60 italic font-normal">Never logged in</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
