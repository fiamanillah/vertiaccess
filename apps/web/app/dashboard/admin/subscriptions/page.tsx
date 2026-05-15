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
} from 'lucide-react'

// New imports
import { PlanDrawer } from './components/plan-drawer'
import plansData from './data/plans.json'

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [plans, setPlans] = React.useState(plansData)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<any | null>(null)

  // --- Handlers ---

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan)
    setDrawerOpen(true)
  }

  const handleCreatePlan = () => {
    setSelectedPlan(null)
    setDrawerOpen(true)
  }

  const handleSavePlan = (updatedPlan: any) => {
    if (selectedPlan) {
      // Edit mode
      setPlans(plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)))
    } else {
      // Create mode
      const newPlan = { ...updatedPlan, id: `tier-${Date.now()}` }
      setPlans([...plans, newPlan])
    }
  }

  // --- Metrics & Directory ---

  const metrics = [
    {
      title: 'Monthly Recurring Revenue',
      value: '£12,450.00',
      description: 'From 3 active subscription plans',
      icon: TrendingUp,
      trend: '+12.5%',
    },
    {
      title: 'PAYG Fees (MTD)',
      value: '£4,230.00',
      description: 'Total platform fees collected this month',
      icon: CreditCard,
      trend: '+8.2%',
    },
    {
      title: 'Active Subscribers',
      value: '142',
      description: 'Total users on paid tiers',
      icon: Users,
      trend: '+5 new this week',
    },
  ]

  const subscribers = [
    {
      id: '1',
      name: 'Falcon Survey Ltd',
      email: 'ops@falconsurvey.com',
      plan: 'Landowner Pro',
      status: 'Active',
      joined: '2024-03-12',
    },
    {
      id: '2',
      name: 'Sky High Media',
      email: 'hello@skyhigh.io',
      plan: 'Starter Tier',
      status: 'Active',
      joined: '2024-04-05',
    },
    {
      id: '3',
      name: 'Urban Inspections',
      email: 'admin@urban-inspec.co.uk',
      plan: 'Pay-As-You-Go',
      status: 'Active',
      joined: '2024-05-01',
    },
    {
      id: '4',
      name: 'Green Field Drones',
      email: 'john@greenfield.com',
      plan: 'Starter Tier',
      status: 'Past Due',
      joined: '2024-02-28',
    },
  ]

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
            Configure pricing strategies, monitor health, and manage
            subscriptions.
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
            {metrics.map((metric) => (
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
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                      <ArrowUpRight className="h-2.5 w-2.5" />
                      {metric.trend}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {metric.description}
                    </p>
                  </div>
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
              <div className="h-[300px] w-full bg-muted/10 rounded-lg flex flex-col items-center justify-center border border-dashed border-border/60">
                <p className="text-muted-foreground text-xs font-medium">
                  Analytics Engine Synchronizing...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Plan Configuration */}
        <TabsContent value="config" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative border-border/60 shadow-none flex flex-col ${plan.isDefault ? 'border-primary/20 bg-primary/[0.02]' : ''}`}
              >
                {plan.isDefault && (
                  <div className="absolute -top-2.5 left-4 z-10">
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0 border-none">
                      Primary
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className="text-muted-foreground border-border/60 text-[10px] px-1.5 py-0"
                    >
                      {plan.badge}
                    </Badge>
                    <a
                      href={`https://dashboard.stripe.com/products/${plan.stripeProductId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {plan.stripeProductId}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight mb-1">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground leading-snug">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight">
                      £{plan.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / mo
                    </span>
                  </div>

                  <Separator className="bg-border/40" />

                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Features
                    </p>
                    <ul className="grid gap-1.5">
                      {plan.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-start gap-2 text-xs font-medium text-foreground"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
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
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Subscriber Directory */}
        <TabsContent value="directory" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-lg font-semibold tracking-tight">Active Subscriptions</h3>
              <p className="text-xs text-muted-foreground">
                Registry of operator accounts
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
                        <span className="text-sm font-semibold tracking-tight text-foreground">
                          {sub.name}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {sub.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs border-border/60 px-1.5 py-0"
                      >
                        {sub.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${sub.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'} border-none text-[10px] px-1.5 py-0`}
                      >
                        {sub.status}
                      </Badge>
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
        </TabsContent>
      </Tabs>

      <PlanDrawer
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        plan={selectedPlan}
        onSave={handleSavePlan}
      />
    </div>
  )
}
