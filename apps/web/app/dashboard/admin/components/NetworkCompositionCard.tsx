'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Globe } from 'lucide-react'

interface NetworkCompositionCardProps {
  assetManagers: number
  droneOperators: number
  activeAssets: number
}

export default function NetworkCompositionCard({
  assetManagers,
  droneOperators,
  activeAssets,
}: NetworkCompositionCardProps) {
  const maxCount = Math.max(assetManagers, droneOperators, activeAssets, 1)

  return (
    <Card className="transition-all duration-300 hover:shadow-md backdrop-blur-sm bg-card/40 border border-blue-500/20 hover:border-blue-500/40">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight text-foreground/80 uppercase">Network Composition</CardTitle>
          <Globe className="h-4 w-4 text-blue-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1 pb-5 px-5">
        {/* Asset Managers */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground/80">Asset Managers</span>
            <span className="font-bold text-foreground">{assetManagers}</span>
          </div>
          <div className="h-1.5 w-full bg-blue-500/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500" 
              style={{ width: `${(assetManagers / maxCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Drone Operators */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground/80">Drone Operators</span>
            <span className="font-bold text-foreground">{droneOperators}</span>
          </div>
          <div className="h-1.5 w-full bg-blue-500/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500" 
              style={{ width: `${(droneOperators / maxCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Active Assets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground/80">Active Assets</span>
            <span className="font-bold text-foreground">{activeAssets}</span>
          </div>
          <div className="h-1.5 w-full bg-blue-500/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500" 
              style={{ width: `${(activeAssets / maxCount) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
