'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { CircleDollarSign } from 'lucide-react'

interface TrendItem {
  month: string
  total: number
  subscription: number
  booking: number
}

interface RevenueGeneratedCardProps {
  totalRevenue: number
  subscriptionRevenue: number
  bookingRevenue: number
  revenueTrend: TrendItem[]
}

export default function RevenueGeneratedCard({
  totalRevenue,
  subscriptionRevenue,
  bookingRevenue,
  revenueTrend,
}: RevenueGeneratedCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Chart configuration
  const width = 600
  const height = 200
  const paddingLeft = 45
  const paddingRight = 15
  const paddingTop = 20
  const paddingBottom = 30

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Find maximum value for scaling Y-axis
  const maxVal = Math.max(...revenueTrend.map((d) => d.total), 1000)
  const yAxisMax = Math.ceil(maxVal / 500) * 500 // round to nearest 500

  // Calculate coordinates
  const points = revenueTrend.map((d, idx) => {
    const x = paddingLeft + (idx / (revenueTrend.length - 1)) * chartWidth
    const y = height - paddingBottom - (d.total / yAxisMax) * chartHeight
    const subY = height - paddingBottom - (d.subscription / yAxisMax) * chartHeight
    const bookY = height - paddingBottom - (d.booking / yAxisMax) * chartHeight
    return { x, y, subY, bookY, ...d }
  })

  // Build SVG Path strings
  const totalPath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const totalAreaPath = firstPoint && lastPoint
    ? `${totalPath} L ${lastPoint.x} ${height - paddingBottom} L ${firstPoint.x} ${height - paddingBottom} Z`
    : ''

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md backdrop-blur-sm bg-card/40 border border-emerald-500/20 hover:border-emerald-500/40 col-span-1 md:col-span-2 lg:col-span-4">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight text-foreground/80 uppercase">Revenue Generated</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-emerald-500" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-1 pb-5 px-5">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Total Revenue</span>
            <span className="text-lg font-black text-foreground">{formatCurrency(totalRevenue)}</span>
          </div>

          <div className="p-3 rounded-lg border border-teal-500/10 bg-teal-500/5">
            <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 block">Subscription Income</span>
            <span className="text-lg font-semibold text-foreground">{formatCurrency(subscriptionRevenue)}</span>
          </div>

          <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Pay-As-You-Go Income</span>
            <span className="text-lg font-semibold text-foreground">{formatCurrency(bookingRevenue)}</span>
          </div>
        </div>

        {/* Dynamic Chart Section */}
        <div className="relative pt-1">
          {/* Custom Interactive Floating Tooltip */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              className="absolute pointer-events-none z-10 bg-popover/95 border border-border text-popover-foreground px-2.5 py-1.5 rounded shadow-lg text-[10px] space-y-0.5 transition-all duration-150"
              style={{
                left: `${points[hoveredIndex].x - 60}px`,
                top: `${points[hoveredIndex].y - 75}px`,
              }}
            >
              <div className="font-bold border-b border-border pb-0.5 mb-1">
                {points[hoveredIndex].month}
              </div>
              <div className="flex justify-between gap-4 font-semibold">
                <span className="text-muted-foreground">Total:</span>
                <span>{formatCurrency(points[hoveredIndex].total)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground/80">Subscription:</span>
                <span>{formatCurrency(points[hoveredIndex].subscription)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground/80">Bookings:</span>
                <span>{formatCurrency(points[hoveredIndex].booking)}</span>
              </div>
            </div>
          )}

          {/* SVG Canvas */}
          <div className="w-full overflow-hidden bg-muted/5 border border-border/20 rounded-lg p-2">
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
              <defs>
                {/* Minimal Area Gradient */}
                <linearGradient id="totalRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = height - paddingBottom - ratio * chartHeight
                const gridVal = ratio * yAxisMax
                return (
                  <g key={index} className="opacity-30 dark:opacity-15">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth="0.75"
                      strokeDasharray="2 3"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] fill-muted-foreground font-semibold"
                    >
                      {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : gridVal}
                    </text>
                  </g>
                )
              })}

              {/* Gradient Area under curve */}
              <path d={totalAreaPath} fill="url(#totalRevenueGradient)" />

              {/* Main Line path */}
              <path
                d={totalPath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-90"
              />

              {/* Interactive Vertical Hover Lines & Hover circles */}
              {points.map((p, idx) => (
                <g key={idx}>
                  {/* Vertical Guideline */}
                  {hoveredIndex === idx && (
                    <line
                      x1={p.x}
                      y1={paddingTop}
                      x2={p.x}
                      y2={height - paddingBottom}
                      stroke="var(--primary)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      className="opacity-40"
                    />
                  )}

                  {/* Marker Circle */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === idx ? 5 : 3}
                    fill="var(--background)"
                    stroke="var(--primary)"
                    strokeWidth={hoveredIndex === idx ? 2.5 : 1.5}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Month Label */}
                  <text
                    x={p.x}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[9px] font-bold transition-colors duration-200 ${
                      hoveredIndex === idx ? 'fill-primary font-black' : 'fill-muted-foreground/70'
                    }`}
                  >
                    {p.month.split(' ')[0]}
                  </text>
                </g>
              ))}

              {/* invisible hit boxes for easier hover interactions */}
              {points.map((p, idx) => (
                <rect
                  key={`hit-${idx}`}
                  x={p.x - chartWidth / (revenueTrend.length - 1) / 2}
                  y={paddingTop}
                  width={chartWidth / (revenueTrend.length - 1)}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
