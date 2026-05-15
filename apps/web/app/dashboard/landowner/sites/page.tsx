'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Eye, MapPin, Building2, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@workspace/ui/lib/utils'
import { SitePreviewModal } from './components/site-preview-modal'
import { DetailedSite } from './schema'
import { useAuthStore } from '@/store/use-auth-store'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert'
import { UserCheck } from 'lucide-react'

// Columns definition moved inside the component to access state handlers

const mockSites: DetailedSite[] = [
  {
    id: '1',
    name: 'Canary Wharf Helipad',
    category: 'Urban Operations',
    siteType: 'toal',
    address: 'South Quay, London',
    postcode: 'E14 9SH',
    latitude: 51.502,
    longitude: -0.019,
    toalRadius: 100,
    toalGeometryMode: 'circle',
    toalPolygonPoints: [],
    allowEmergencyLanding: true,
    emergencyRadius: 350,
    emergencyGeometryMode: 'circle',
    contactEmail: 'ops@canarywharfheli.com',
    contactPhone: '020 7123 4567',
    description:
      'Prime urban operations pad located in the heart of the financial district.',
    photoUrls: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    ],
    isPermanentActivation: true,
    bookingApprovalModel: 'manual',
    policyDocuments: ['https://example.com/doc1.pdf'],
    toalFee: 125.0,
    emergencyFee: 400.0,
    status: 'active',
    createdAt: '2024-05-10',
  },
  {
    id: '2',
    name: 'Surrey Hills Emergency Pad',
    category: 'Rural Support',
    siteType: 'emergency',
    address: 'Old Farm Lane, Guildford',
    postcode: 'GU2 7XW',
    latitude: 51.236,
    longitude: -0.57,
    toalRadius: 50,
    toalGeometryMode: 'circle',
    toalPolygonPoints: [],
    allowEmergencyLanding: true,
    emergencyRadius: 500,
    emergencyGeometryMode: 'circle',
    contactEmail: 'farm.manager@surreyhills.com',
    contactPhone: '01483 123456',
    description:
      'Large open field suitable for emergency and recovery operations.',
    photoUrls: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    ],
    isPermanentActivation: false,
    activationStartDate: '2024-06-01',
    activationEndDate: '2024-08-31',
    activationStartTime: '08:00',
    activationEndTime: '20:00',
    bookingApprovalModel: 'auto',
    policyDocuments: [],
    toalFee: 45.0,
    emergencyFee: 150.0,
    status: 'pending',
    createdAt: '2024-05-11',
  },
  {
    id: '3',
    name: 'Manchester City Vertiport',
    category: 'Urban Operations',
    siteType: 'toal',
    address: 'Deansgate, Manchester',
    postcode: 'M3 4LQ',
    latitude: 53.477,
    longitude: -2.253,
    toalRadius: 75,
    toalGeometryMode: 'polygon',
    toalPolygonPoints: [
      [53.477, -2.253],
      [53.478, -2.253],
      [53.478, -2.252],
      [53.477, -2.252],
    ],
    allowEmergencyLanding: false,
    contactEmail: 'admin@mcr-vertiport.co.uk',
    contactPhone: '0161 987 6543',
    description: 'Rooftop vertiport serving the Greater Manchester area.',
    photoUrls: [],
    isPermanentActivation: true,
    bookingApprovalModel: 'manual',
    policyDocuments: [
      'https://example.com/mcr-safety.pdf',
      'https://example.com/mcr-ops.pdf',
    ],
    toalFee: 85.0,
    emergencyFee: 0.0,
    status: 'active',
    createdAt: '2024-05-08',
  },
]

export default function MySitesPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isVerified = user?.verified || false
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedSite, setSelectedSite] = React.useState<DetailedSite | null>(
    null,
  )

  const columns = React.useMemo<ColumnDef<DetailedSite>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Site Details',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 py-1">
            <span className="font-bold text-sm text-foreground tracking-tight">
              {row.original.name}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="text-[9px] uppercase tracking-widest h-4 px-1 font-bold bg-muted/50 border-none"
              >
                {row.original.category}
              </Badge>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Location',
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="truncate max-w-[220px]">
                {row.original.address}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/70 font-mono ml-4.5">
              {row.original.postcode}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'siteType',
        header: 'Primary Function',
        cell: ({ row }) => {
          const isToal = row.original.siteType === 'toal'
          return (
            <Badge
              variant="outline"
              className={cn(
                'capitalize text-[10px] font-bold tracking-wide px-2 h-5 border-none',
                isToal
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30',
              )}
            >
              {row.original.siteType.toUpperCase()}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'toalFee',
        header: 'Base Fee',
        cell: ({ row }) => (
          <div className="flex items-baseline gap-0.5 font-mono">
            <span className="text-[10px] text-muted-foreground">£</span>
            <span className="text-sm font-bold text-foreground">
              {row.original.toalFee.toFixed(2)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge
              className={cn(
                'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2',
                status === 'active'
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                  : status === 'pending'
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                    : 'bg-red-100 text-red-700 hover:bg-red-100',
              )}
            >
              {status}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 px-3"
              onClick={() => setSelectedSite(row.original)}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header with quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-primary/70">
              Total Registered Sites
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">
              03
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />2 sites are
              currently active
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Pending Approval
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground/80">
              01
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              Expected review within 24 hours
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Total Earnings
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground/80">
              £1,240.50
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] h-4 px-1.5 font-bold">
                +12%
              </Badge>
              Increase from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {!isVerified && (
        <Alert className="border-amber-500/50 bg-amber-500/5 text-amber-900 dark:text-amber-100 mb-2">
          <UserCheck className="h-5 w-5 text-amber-600" />
          <div className="flex w-full items-center justify-between gap-4">
            <div className="space-y-1">
              <AlertTitle className="text-sm font-black uppercase tracking-widest">
                Identity Verification Pending
              </AlertTitle>
              <AlertDescription className="text-xs font-medium opacity-90">
                Please verify your identity to upload and list sites on our
                platform.
              </AlertDescription>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/profile">Verify ID</Link>
            </Button>
          </div>
        </Alert>
      )}

      <Card className="shadow-md border-border/60">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-6 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-xl font-bold tracking-tight">
                Site Management
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              Monitor and manage your takeoff and landing locations across the
              network.
            </CardDescription>
          </div>
          {!isVerified ? (
            <div className="flex flex-col items-end gap-2">
              <Button
                disabled
                className="font-bold shadow-md opacity-50 cursor-not-allowed w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
                REGISTER NEW SITE
              </Button>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                Verify account to add sites
              </span>
            </div>
          ) : (
            <Button
              asChild
              className="font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Link href="/dashboard/landowner/sites/add">
                <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
                REGISTER NEW SITE
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={mockSites}
            totalRows={mockSites.length}
            totalPages={1}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </CardContent>
      </Card>

      <SitePreviewModal
        site={selectedSite}
        isOpen={selectedSite !== null}
        onClose={() => setSelectedSite(null)}
        onEdit={(id) => router.push(`/dashboard/landowner/sites/edit/${id}`)}
      />
    </div>
  )
}
