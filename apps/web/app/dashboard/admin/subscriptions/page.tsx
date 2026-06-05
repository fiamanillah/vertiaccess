'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@workspace/ui/components/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { toast } from 'sonner'
import {
  TrendingUp,
  Users,
  CreditCard,
  Search,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  Settings2,
  Calendar,
  AlertCircle,
  Package,
} from 'lucide-react'

import { PlanDrawer } from './components/plan-drawer'
import { subscriptionService, type SubscriptionPlan, type UserSubscriptionDetail } from '@/services/subscription.service'

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([])
  const [subscribers, setSubscribers] = React.useState<UserSubscriptionDetail[]>([])
  const [metrics, setMetrics] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [plansRes, subsRes, metricsRes] = await Promise.all([
        subscriptionService.listPlans(true),
        subscriptionService.listSubscriptions(),
        subscriptionService.getMetrics(),
      ])

      if (plansRes.success) {
        setPlans(plansRes.data)
      }
      if (subsRes.success) {
        setSubscribers(subsRes.data)
      }
      if (metricsRes.success) {
        setMetrics(metricsRes.data)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load subscription registry data')
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  // --- Handlers ---

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setDrawerOpen(true)
  }

  const handleCreatePlan = () => {
    setSelectedPlan(null)
    setDrawerOpen(true)
  }

  const handleSavePlan = async (updatedPlan: any) => {
    try {
      if (selectedPlan) {
        // Edit mode
        const res = await subscriptionService.updatePlan(selectedPlan.id, {
          name: updatedPlan.name,
          badge: updatedPlan.badge,
          description: updatedPlan.description,
          billingType: updatedPlan.billingType,
          currency: updatedPlan.currency,
          monthlyPrice: updatedPlan.monthlyPrice,
          annualPrice: updatedPlan.annualPrice,
          platformFee: updatedPlan.platformFee,
          isActive: updatedPlan.isActive,
          customFeatures: updatedPlan.customFeatures,
          limits: updatedPlan.limits,
        })
        if (res.success) {
          toast.success('Monetization tier updated successfully')
          loadData()
        }
      } else {
        // Create mode
        const res = await subscriptionService.createPlan({
          name: updatedPlan.name,
          badge: updatedPlan.badge,
          description: updatedPlan.description,
          billingType: updatedPlan.billingType,
          currency: updatedPlan.currency,
          monthlyPrice: updatedPlan.monthlyPrice,
          annualPrice: updatedPlan.annualPrice,
          platformFee: updatedPlan.platformFee,
          isActive: updatedPlan.isActive,
          customFeatures: updatedPlan.customFeatures,
          limits: updatedPlan.limits,
        })
        if (res.success) {
          toast.success('Monetization tier created successfully')
          loadData()
        }
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save subscription tier')
    }
  }

  const getCurrencySymbol = (currency: string) => {
    switch (currency?.toUpperCase()) {
      case 'USD':
        return '$'
      case 'EUR':
        return '€'
      case 'GBP':
      default:
        return '£'
    }
  }

  // --- Filtered Subscribers ---
  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.organisation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.planName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const mrrValue = metrics?.mrr !== undefined ? `£${metrics.mrr.toFixed(2)}` : '£0.00'
  const paygValue = metrics?.paygFeesMtd !== undefined ? `£${metrics.paygFeesMtd.toFixed(2)}` : '£0.00'
  const activeSubsValue = metrics?.activeSubscribers !== undefined ? String(metrics.activeSubscribers) : '0'

  const metricCards = [
    {
      title: 'Monthly Recurring Revenue',
      value: mrrValue,
      description: 'Recurring value from monthly/annual tiers',
      icon: TrendingUp,
    },
    {
      title: 'PAYG Fees (MTD)',
      value: paygValue,
      description: 'Platform fees settled this month',
      icon: CreditCard,
    },
    {
      title: 'Active Subscribers',
      value: activeSubsValue,
      description: 'Total active billing plans',
      icon: Users,
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-7xl mx-auto w-full px-4 md:px-8 py-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0">
            Financial Control
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Monetization Desk
          </h1>
          <p className="text-muted-foreground font-medium text-xs max-w-xl">
            Configure pricing strategies, monitor health, and manage subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-2"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Billing Settings
          </Button>
          <Button
            size="sm"
            className="text-xs gap-2"
            onClick={handleCreatePlan}
          >
            <Plus className="h-3.5 w-3.5" />
            Create New Tier
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/60 shadow-none">
                <CardHeader className="pb-2">
                  <Skeleton className="h-3.5 w-24" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-48" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border/60 shadow-none">
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-6">
            <TabsTrigger
              value="revenue"
              className="text-xs py-1.5"
            >
              Metrics
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="text-xs py-1.5"
            >
              Plans
            </TabsTrigger>
            <TabsTrigger
              value="directory"
              className="text-xs py-1.5"
            >
              Subscribers
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Revenue & Metrics */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metricCards.map((metric) => (
                <Card key={metric.title} className="border-border/60 shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {metric.title}
                    </CardTitle>
                    <metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {metric.value}
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground mt-1.5">
                      {metric.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border/60 shadow-none">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Revenue Breakdown
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  MTD Transactional performance overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full bg-muted/10 rounded-lg flex flex-col items-center justify-center border border-dashed border-border/60 p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mb-2 opacity-65" />
                  <p className="text-muted-foreground text-xs font-semibold">
                    Pricing & Analytics Sync
                  </p>
                  <p className="text-muted-foreground text-[10px] max-w-sm mt-1">
                    System active. Transaction ledgers aggregated directly from Stripe integration logs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Plan Configuration */}
          <TabsContent value="config" className="space-y-6">
            {plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border/60 p-12 text-center rounded-lg bg-muted/5 min-h-[300px]">
                <Package className="h-10 w-10 text-muted-foreground opacity-50 mb-3" />
                <p className="text-sm font-semibold text-foreground">No Pricing Tiers Found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Create your first subscription or Pay-As-You-Go tier to start publishing prices.
                </p>
                <Button size="sm" className="mt-4 text-xs gap-2" onClick={handleCreatePlan}>
                  <Plus className="h-3.5 w-3.5" />
                  Create First Tier
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {plans.map((plan) => {
                  const displayPrice = plan.billingType === 'payg' ? plan.platformFee : plan.monthlyPrice
                  const symbol = getCurrencySymbol(plan.currency)
                  const unitLabel = plan.billingType === 'payg' ? 'booking' : 'mo'

                  return (
                    <Card
                      key={plan.id}
                      className={`relative border-border/60 shadow-none flex flex-col overflow-visible ${!plan.isActive ? 'opacity-65' : ''}`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-2.5 left-4 z-10">
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0 border-none">
                            {plan.badge}
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-border/60 text-[10px] px-1.5 py-0 capitalize"
                          >
                            {plan.billingType === 'payg' ? 'PAYG' : 'Subscription'}
                          </Badge>
                          {plan.stripeProductId && (
                            <a
                              href={`https://dashboard.stripe.com/products/${plan.stripeProductId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                              Stripe Product
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-semibold tracking-tight mb-1">
                            {plan.name}
                          </CardTitle>
                          {!plan.isActive && (
                            <Badge variant="secondary" className="text-[8px] px-1 py-0 uppercase">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs font-medium text-muted-foreground leading-snug">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1 space-y-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold tracking-tight">
                            {symbol}{displayPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {unitLabel}
                          </span>
                        </div>

                        {plan.billingType === 'subscription' && plan.annualPrice > 0 && (
                          <p className="text-[10px] font-medium text-muted-foreground">
                            Annual rate: {symbol}{plan.annualPrice.toFixed(2)} / yr
                          </p>
                        )}

                        <Separator className="bg-border/40" />

                        {plan.customFeatures && plan.customFeatures.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Features
                            </p>
                            <ul className="grid gap-1.5">
                              {plan.customFeatures.map((feat, i) => (
                                <li
                                  key={i}
                                  className={`flex items-start gap-2 text-xs font-medium ${feat.included ? 'text-foreground' : 'text-muted-foreground line-through opacity-70'}`}
                                >
                                  <CheckCircle2 className={`h-3.5 w-3.5 ${feat.included ? 'text-emerald-500' : 'text-muted-foreground'} mt-0.5 shrink-0`} />
                                  {feat.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="pt-4 pb-4 px-4 border-t border-border/40">
                        <Button
                          onClick={() => handleEditPlan(plan)}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-8"
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                          Modify Tier
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Subscriber Directory */}
          <TabsContent value="directory" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-lg font-semibold tracking-tight">Active Subscriptions</h3>
                <p className="text-xs text-muted-foreground">
                  Registry of operator and asset owner accounts currently on billing plans
                </p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input
                  placeholder="Search..."
                  className="pl-8 h-8 text-xs bg-muted/10 border-border/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredSubscribers.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-border/60 p-12 text-center rounded-lg bg-muted/5 min-h-[200px]">
                <Users className="h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm font-semibold text-foreground">No Subscribers Found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {searchQuery ? 'Try adjusting your search query.' : 'Active subscriber details will show here when billing is activated by operators.'}
                </p>
              </div>
            ) : (
              <Card className="border-border/60 shadow-none overflow-hidden rounded-lg">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/60">
                      <TableHead className="text-xs py-3 pl-6">
                        Operator
                      </TableHead>
                      <TableHead className="text-xs py-3">
                        Plan
                      </TableHead>
                      <TableHead className="text-xs py-3">
                        Status
                      </TableHead>
                      <TableHead className="text-xs py-3">
                        Renewal / Expiry Date
                      </TableHead>
                      <TableHead className="text-xs py-3 text-right pr-6">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscribers.map((sub) => (
                      <TableRow
                        key={sub.id}
                        className="border-border/40 hover:bg-muted/5 transition-colors"
                      >
                        <TableCell className="pl-6 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                              {sub.name}
                              {sub.organisation && (
                                <span className="text-[10px] text-muted-foreground font-medium px-1 bg-muted/50 rounded">
                                  {sub.organisation}
                                </span>
                              )}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {sub.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              variant="outline"
                              className="text-xs border-border/60 px-1.5 py-0 w-fit"
                            >
                              {sub.planName}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                              {sub.billingType === 'payg' ? 'PAYG' : `GBP ${sub.price.toFixed(2)}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${sub.status.toLowerCase() === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'} border-none text-[10px] px-1.5 py-0 uppercase font-semibold`}
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      <PlanDrawer
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        plan={selectedPlan}
        onSave={handleSavePlan}
      />
    </div>
  )
}
