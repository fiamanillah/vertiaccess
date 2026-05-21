'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowRight, FileSignature, Loader2, ShieldCheck } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { bookingService } from '@/services/booking.service'
import type { Booking } from '@/services/booking.types'

export default function Page() {
  const router = useRouter()
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    bookingService
      .listMyBookings()
      .then((data) => {
        if (active) {
          setBookings(data)
          setError(null)
        }
      })
      .catch((err: any) => {
        if (active) {
          setError(err?.message ?? 'Failed to load consent certificates')
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const certificateBookings = React.useMemo(
    () => bookings.filter((booking) => Boolean(booking.certificateId)),
    [bookings],
  )

  const latestCertificate = React.useMemo(
    () => certificateBookings[0] ?? null,
    [certificateBookings],
  )

  const openCertificate = (bookingId: string) => {
    router.push(`/certificates/${bookingId}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black tracking-tight uppercase">
          Consent Certificates
        </h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
          View live certificates generated from your approved bookings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Certificates Ready</CardDescription>
            <CardTitle className="text-3xl">
              {certificateBookings.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest Approval</CardDescription>
            <CardTitle className="text-lg">
              {latestCertificate
                ? latestCertificate.bookingReference
                : 'None yet'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Certificate Source</CardDescription>
            <CardTitle className="text-lg">Booking Data</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 p-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading certificates…
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isLoading && !error && latestCertificate && (
        <Card className="border-primary/10 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <CardDescription className="text-primary">
                Most recent certificate
              </CardDescription>
            </div>
            <CardTitle>
              {latestCertificate.siteName ?? 'Approved booking'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-bold">Booking:</span>{' '}
                {latestCertificate.bookingReference}
              </p>
              <p>
                <span className="font-bold">Status:</span>{' '}
                {latestCertificate.status}
              </p>
              <p>
                <span className="font-bold">Issued:</span>{' '}
                {latestCertificate.certificateVaId ?? 'Ready'}
              </p>
            </div>
            <Button onClick={() => openCertificate(latestCertificate.id)}>
              Open Certificate
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generated Certificates</CardTitle>
          <CardDescription>
            Approved bookings with consent certificates ready to view and print.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificateBookings.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 text-center">
              <FileSignature className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-semibold">No certificates yet</p>
                <p className="text-sm text-muted-foreground">
                  Certificates appear here after an approved booking is
                  generated.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/operator/bookings')}
              >
                View bookings
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {certificateBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {booking.siteName ?? 'Site certificate'}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.bookingReference} ·{' '}
                      {format(
                        new Date(booking.createdAt),
                        'dd MMM yyyy, HH:mm',
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => openCertificate(booking.id)}
                  >
                    Open certificate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
