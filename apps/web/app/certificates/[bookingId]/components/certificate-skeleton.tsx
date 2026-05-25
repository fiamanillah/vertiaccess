'use client';

import * as React from 'react'
import { Skeleton } from '@workspace/ui/components/skeleton'

export function CertificateSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20 pb-24 md:pb-12">
      <div className="mx-auto w-full max-w-6xl p-4 md:p-8 space-y-6">
        {/* Action Header Skeleton */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="flex gap-2.5">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Certificate Shell Skeleton */}
        <div className="overflow-hidden border border-border bg-card shadow-xl rounded-3xl">
          {/* Header Block Skeleton */}
          <div className="relative bg-muted/40 border-b border-border p-8 md:p-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-5 flex-1">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-5 w-40 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex gap-6 pt-4 border-t border-border">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <div className="flex flex-row items-center gap-4 md:flex-col md:items-end shrink-0">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>

          {/* Content Grid Skeleton */}
          <div className="p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-8">
                {/* Validity Window */}
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <div className="grid gap-4 sm:grid-cols-2 bg-muted/10 rounded-2xl p-5 border border-border/50">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </div>
                </div>

                {/* Site Details */}
                <div className="space-y-4">
                  <Skeleton className="h-5 w-40" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="space-y-3">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-[260px] w-full rounded-2xl" />
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 space-y-8">
                {/* Operator Profile */}
                <div className="space-y-4">
                  <Skeleton className="h-5 w-44" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>

                {/* Landowner Authority */}
                <div className="space-y-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>

                {/* Security Block */}
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="border-t border-border bg-muted/20 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
