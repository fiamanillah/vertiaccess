'use client'

import React from 'react'

interface LineChartDataPoint {
  label: string
  values: number[]
}

interface LineChartProps {
  data: LineChartDataPoint[]
  seriesNames: string[]
  colors: string[]
}

export function LineChart({ data, seriesNames, colors }: LineChartProps) {
  if (!data || data.length === 0) return null

  // Find max value for scaling
  const allValues = data.flatMap((d) => d.values)
  const maxValue = Math.max(...allValues, 10) // default min scale to 10
  const paddedMax = Math.ceil(maxValue * 1.15)

  // Chart dimensions
  const width = 600
  const height = 250
  const paddingLeft = 50
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 40

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Coordinates helper
  const getCoordinates = (index: number, val: number) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth
    const y = paddingTop + chartHeight - (val / paddedMax) * chartHeight
    return { x, y }
  }

  // Draw grid lines
  const gridLines = []
  const gridTicks = 5
  for (let i = 0; i <= gridTicks; i++) {
    const yVal = (paddedMax / gridTicks) * i
    const yCoord = paddingTop + chartHeight - (yVal / paddedMax) * chartHeight
    gridLines.push(
      <g key={i}>
        <line
          x1={paddingLeft}
          y1={yCoord}
          x2={width - paddingRight}
          y2={yCoord}
          className="stroke-muted/50 stroke-1"
          strokeDasharray="4 4"
        />
        <text
          x={paddingLeft - 10}
          y={yCoord + 4}
          className="fill-muted-foreground text-[10px] font-medium text-right"
          textAnchor="end"
        >
          {Math.round(yVal)}
        </text>
      </g>,
    )
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 justify-end">
        {seriesNames.map((name, idx) => (
          <div key={name} className="flex items-center gap-2 text-xs font-medium">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[idx] }}
            />
            <span className="text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full aspect-[2.4/1]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            {colors.map((color, idx) => (
              <linearGradient
                key={idx}
                id={`gradient-${idx}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          <g>{gridLines}</g>

          {/* Area under lines */}
          {seriesNames.map((_, seriesIdx) => {
            const points = data.map((d, itemIdx) =>
              getCoordinates(itemIdx, d.values[seriesIdx] ?? 0),
            )
            const firstPointX = points[0]?.x ?? 0
            const areaPath = [
              `M ${firstPointX} ${paddingTop + chartHeight}`,
              ...points.map((p) => `L ${p.x} ${p.y}`),
              `L ${points[points.length - 1]?.x ?? 0} ${paddingTop + chartHeight}`,
              'Z',
            ].join(' ')

            return (
              <path
                key={`area-${seriesIdx}`}
                d={areaPath}
                fill={`url(#gradient-${seriesIdx})`}
              />
            )
          })}

          {/* Line paths */}
          {seriesNames.map((_, seriesIdx) => {
            const linePath = data
              .map((d, itemIdx) => {
                const { x, y } = getCoordinates(itemIdx, d.values[seriesIdx] ?? 0)
                return `${itemIdx === 0 ? 'M' : 'L'} ${x} ${y}`
              })
              .join(' ')

            return (
              <path
                key={`line-${seriesIdx}`}
                d={linePath}
                fill="none"
                stroke={colors[seriesIdx]}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )
          })}

          {/* Dots on line intersections */}
          {seriesNames.map((_, seriesIdx) =>
            data.map((d, itemIdx) => {
              const { x, y } = getCoordinates(itemIdx, d.values[seriesIdx] ?? 0)
              return (
                <circle
                  key={`dot-${seriesIdx}-${itemIdx}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="white"
                  stroke={colors[seriesIdx]}
                  strokeWidth="2"
                  className="cursor-pointer hover:r-5 transition-all duration-150"
                />
              )
            }),
          )}

          {/* X-Axis Labels */}
          {data.map((d, idx) => {
            const x = paddingLeft + (idx / (data.length - 1)) * chartWidth
            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                className="fill-muted-foreground text-[10px] font-medium"
                textAnchor="middle"
              >
                {d.label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

interface BarChartItem {
  label: string
  value: number
}

interface BarChartProps {
  data: BarChartItem[]
  color: string
}

export function BarChart({ data, color }: BarChartProps) {
  if (!data || data.length === 0) return null

  const maxValue = Math.max(...data.map((d) => d.value), 10)
  const paddedMax = Math.ceil(maxValue * 1.1)

  const width = 600
  const height = 200
  const paddingLeft = 50
  const paddingRight = 20
  const paddingTop = 10
  const paddingBottom = 30

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  const barWidth = (chartWidth / data.length) * 0.6
  const barGap = (chartWidth / data.length) * 0.4

  return (
    <div className="relative w-full aspect-[3/1]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
      >
        {/* Y Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const yVal = paddedMax * ratio
          const yCoord = paddingTop + chartHeight - ratio * chartHeight
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={yCoord}
                x2={width - paddingRight}
                y2={yCoord}
                className="stroke-muted/40 stroke-1"
              />
              <text
                x={paddingLeft - 10}
                y={yCoord + 3}
                className="fill-muted-foreground text-[10px] font-medium text-right"
                textAnchor="end"
              >
                {Math.round(yVal)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const x = paddingLeft + idx * (barWidth + barGap) + barGap / 2
          const barHeight = (item.value / paddedMax) * chartHeight
          const y = paddingTop + chartHeight - barHeight

          return (
            <g key={idx} className="group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={color}
                className="opacity-90 hover:opacity-100 transition-all duration-200 cursor-pointer"
              />
              {/* Value on top of bar */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                className="fill-foreground text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                textAnchor="middle"
              >
                {item.value}
              </text>
              {/* X label */}
              <text
                x={x + barWidth / 2}
                y={height - 10}
                className="fill-muted-foreground text-[9px] font-medium"
                textAnchor="middle"
              >
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

interface RadialProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
}

export function RadialProgress({
  value,
  size = 120,
  strokeWidth = 12,
  color = 'currentColor',
  trackColor = 'var(--muted)',
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Value Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tracking-tight">{value}%</span>
      </div>
    </div>
  )
}
