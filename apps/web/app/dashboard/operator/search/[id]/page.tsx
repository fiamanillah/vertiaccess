'use client'

import * as React from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { siteService } from '@/services/site.service'
import { SiteDetailsContext } from './components/site-details-context'
import { BookingEngineCard } from './components/booking-engine'
import { Button } from '@workspace/ui/components/button'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
} from '@workspace/ui/components/drawer'

export default function SiteDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const siteId = params.id as string

  const [site, setSite] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const initialOpType = searchParams.get('type') === 'emergency' ? 'emergency' : 'toal'

  React.useEffect(() => {
    let active = true

    async function fetchSite() {
      try {
        const res = await siteService.getPublicSite(siteId)
        if (active && res.success) {
          setSite(res.data)
        }
      } catch (err: any) {
        if (active) {
          toast.error(err.message || 'Failed to fetch site details')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    if (siteId) {
      fetchSite()
    }

    return () => {
      active = false
    }
  }, [siteId])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">
          Loading site details...
        </p>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Site not found</h2>
        <Button onClick={() => router.push('/dashboard/operator/search')}>
          Back to Search
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto w-full p-2 pb-24 lg:pb-6">
      {/* Breadcrumb/Back link */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ml-4"
          onClick={() => router.push('/dashboard/operator/search')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Sites
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Context (Scrolls normally) */}
        <div className="lg:col-span-8 space-y-8">
          <SiteDetailsContext site={site} />
        </div>

        {/* Right Side: Booking Engine (Sticky on Desktop, hidden on Mobile) */}
        <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
          <BookingEngineCard
            site={site}
            initialOperationType={initialOpType}
            className="sticky top-24 max-h-[calc(100vh-8rem)]"
          />
        </div>
      </div>

      {/* Sticky Mobile/Tablet Booking Button Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-md border-t border-border/80 px-4 py-3.5 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mb-0.5">
            Standard Access Fee
          </span>
          <p className="text-lg font-black text-primary leading-none">
            £{(site.toalAccessFee || 0).toFixed(2)}
          </p>
        </div>
        <Drawer>
          <DrawerTrigger asChild>
            <Button className="px-6 font-bold shadow-md shadow-primary/20 h-10">
              Book Now
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh] bg-background">
            <DrawerHeader className="text-left border-b pb-2 px-4">
              <DrawerTitle className="text-base font-black">
                Book Landing Site
              </DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto p-3 pb-8 flex-1">
              <BookingEngineCard
                site={site}
                initialOperationType={initialOpType}
                className="border-none shadow-none bg-transparent max-h-[70vh]"
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
