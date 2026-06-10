'use client'

import * as React from 'react'
import { Search, Filter, MapPin, Zap, Shield } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog'

interface SearchHeaderProps {
  filters: {
    q: string
    radius: string
    siteType: string
    autoApprove: string
  }
  onFilterChange: (
    updates: Partial<{
      q: string
      radius: string
      siteType: string
      autoApprove: string
      lat: string
      lng: string
    }>,
  ) => void
}

export function SearchHeader({ filters, onFilterChange }: SearchHeaderProps) {
  const [localQuery, setLocalQuery] = React.useState(filters.q || '')
  const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false)

  const handleAllowLocation = () => {
    setIsLocationModalOpen(false)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onFilterChange({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          })
        },
        (error) => {
          console.error('Location error:', error)
        },
      )
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilterChange({ q: localQuery })
  }

  return (
    <div className="sticky top-4 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40 pb-4 pt-4 lg:pt-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
        <form
          onSubmit={handleSearchSubmit}
          className="relative min-w-70 lg:max-w-md flex-1 group"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            type="text"
            placeholder="Search by city, postcode, or coordinates..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="pl-9 pr-28 h-9 w-full rounded-xl bg-muted/40 border-border/50 focus:bg-background shadow-inner text-sm"
          />
          <div className="absolute inset-y-0 right-1 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLocationModalOpen(true)}
              className="h-7 px-2 text-muted-foreground hover:text-primary hover:bg-muted/60 rounded-lg"
            >
              <MapPin className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 rounded-lg px-3 font-bold shadow-sm text-xs"
            >
              Search
            </Button>
          </div>
        </form>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide shrink-0 lg:ml-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mr-1">
              Filters
            </span>
          </div>

          <Select
            value={filters.radius}
            onValueChange={(val) => onFilterChange({ radius: val })}
          >
            <SelectTrigger className="w-35 h-9 rounded-xl bg-background border-border/60 text-xs font-semibold shadow-sm shrink-0">
              <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Radius" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Within 5km</SelectItem>
              <SelectItem value="10">Within 10km</SelectItem>
              <SelectItem value="15">Within 15km</SelectItem>
              <SelectItem value="20">Within 20km</SelectItem>
              <SelectItem value="25">Within 25km</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.siteType}
            onValueChange={(val) => onFilterChange({ siteType: val })}
          >
            <SelectTrigger className="w-40 h-9 rounded-xl bg-background border-border/60 text-xs font-semibold shadow-sm shrink-0">
              <SelectValue placeholder="Site Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Site Types</SelectItem>
              <SelectItem value="toal">Standard TOAL</SelectItem>
              <SelectItem value="emergency">Emergency / Recovery</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.autoApprove}
            onValueChange={(val) => onFilterChange({ autoApprove: val })}
          >
            <SelectTrigger className="w-40 h-9 rounded-xl bg-background border-border/60 text-xs font-semibold shadow-sm shrink-0">
              <SelectValue placeholder="Approval Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Approvals</SelectItem>
              <SelectItem value="auto">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
                  <span>Auto-Approval</span>
                </div>
              </SelectItem>
              <SelectItem value="manual">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-500" />
                  <span>Manual Review</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AlertDialog
          open={isLocationModalOpen}
          onOpenChange={setIsLocationModalOpen}
        >
          <AlertDialogContent className="sm:max-w-md p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <AlertDialogHeader className="gap-4 relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <AlertDialogTitle className="text-xl font-bold">
                  Find sites closest to you
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground/90 leading-relaxed pt-1">
                  To calculate exact distances and show TOAL sites near your
                  current position, we need access to your device&apos;s
                  location. We only use this while you are browsing.
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-4 sm:justify-between border-none bg-transparent p-0 relative z-10 gap-3 sm:gap-0">
              <AlertDialogCancel
                onClick={() => setIsLocationModalOpen(false)}
                className="font-bold w-full sm:w-auto"
              >
                Not Now
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAllowLocation}
                className="font-bold w-full sm:w-auto shadow-md shadow-primary/20"
              >
                Allow Location
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
