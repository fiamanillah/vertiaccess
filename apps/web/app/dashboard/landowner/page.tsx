'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  ArrowRight,
  Wallet,
  UserCheck,
  Inbox,
  Globe,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'

export default function Page() {
  // Mock states for account status
  const [isStripeConnected, setIsStripeConnected] = React.useState(false)
  const [isIdVerified, setIsIdVerified] = React.useState(false)

  const needsAttention = [
    {
      id: 'attn-1',
      type: 'booking_request',
      title: 'Alex Morgan requested Planned TOAL',
      description: 'North Field Estate for tomorrow at 10:00 AM.',
      action: 'Review Request',
      link: '/dashboard/landowner/bookings',
    },
    {
      id: 'attn-2',
      type: 'emergency_confirmation',
      title: 'Emergency flight window ended',
      description:
        'North Field Estate. Awaiting operator confirmation, or file a dispute.',
      action: 'View Status',
      link: '/dashboard/landowner/incident-report',
    },
    {
      id: 'attn-3',
      type: 'admin_message',
      title: 'VertiAccess Support replied',
      description: 'Update regarding Incident INC-1042.',
      action: 'View Message',
      link: '/dashboard/notifications',
    },
  ]

  const todaySchedule = [
    {
      id: 'sch-1',
      time: '14:00 - 16:00',
      operator: 'Falcon Survey Ltd',
      type: 'Planned TOAL',
      hasCertificate: true,
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-8 max-w-7xl mx-auto">
      {/* Global Alert Banners (Morning Briefing) */}
      <div className="flex flex-col gap-3">
        {!isStripeConnected && (
          <Alert
            variant="destructive"
            className=" border-destructive/50 bg-destructive/5 "
          >
            <Wallet className="h-5 w-5" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-black uppercase tracking-widest">
                  Action Required: Payouts Disabled
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90">
                  Connect your bank account via Stripe to receive payouts for
                  your approved drone operations.
                </AlertDescription>
              </div>
              <Button size="sm" variant="destructive" asChild>
                <Link href="/dashboard/landowner/balance">
                  Connect Stripe
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Alert>
        )}

        {!isIdVerified && (
          <Alert className=" border-amber-500/50 bg-amber-500/5 text-amber-900  dark:text-amber-100">
            <UserCheck className="h-5 w-5 text-amber-600" />
            <div className="flex w-full items-center justify-between gap-4">
              <div className="space-y-1">
                <AlertTitle className="text-sm font-black uppercase tracking-widest">
                  Identity Verification Pending
                </AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-90">
                  Your sites are currently hidden from search. Verify your
                  identity to start receiving booking requests.
                </AlertDescription>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/profile">
                  Verify ID
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Alert>
        )}
      </div>

      {/* At-a-Glance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Requests */}
        <Link
          href="/dashboard/landowner/bookings"
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Pending Requests
              </CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-foreground">
                4
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
                Bookings awaiting manual approval
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Available Earnings */}
        <Link
          href="/dashboard/landowner/balance"
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Available Earnings
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-foreground">
                £250.00
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
                Ready to withdraw to bank
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Active Sites */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Active Sites
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              2 / 3
            </div>
            <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
              Sites verified and online
            </p>
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card className="border-border/60 bg-muted/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Action Required
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              1
            </div>
            <p className="mt-1 text-[10px] font-medium text-muted-foreground line-clamp-1">
              Unresolved incidents or emergencies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Workflow (Split View) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Needs Your Attention */}
        <Card className="flex flex-col border-border/60 shadow-md">
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-black uppercase tracking-tight">
                  Needs Your Attention
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Action Inbox
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 divide-y divide-border/40 p-0">
            {needsAttention.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col gap-4 p-5 transition-colors hover:bg-muted/10"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.type === 'booking_request' && (
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                    )}
                    {item.type === 'emergency_confirmation' && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {item.type === 'admin_message' && (
                      <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    <span className="text-xs font-bold text-foreground line-clamp-1">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-border/60 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    asChild
                  >
                    <Link href={item.link}>
                      {item.action}
                      <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {needsAttention.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">
                  Your inbox is clear.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: On Your Property Today */}
        <Card className="flex flex-col border-border/60 shadow-md">
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-black uppercase tracking-tight">
                  On Your Property Today
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Property Ledger
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 divide-y divide-border/40 p-0">
            {todaySchedule.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/10"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.time}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-black tracking-tight">
                      {item.operator}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {item.type}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {item.hasCertificate && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
                    >
                      <CheckCircle2 className="mr-1.5 h-3 w-3" />
                      Valid Certificate
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    asChild
                  >
                    <Link href={`/dashboard/landowner/bookings`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {todaySchedule.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="rounded-full bg-muted/50 p-4">
                  <Calendar className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground max-w-[200px]">
                  No drone operations scheduled for your properties today.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
