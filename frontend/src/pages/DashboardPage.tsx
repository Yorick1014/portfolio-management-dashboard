import { useEffect, useMemo, useState } from 'react'
import {
  getDashboardSummary,
  getDashboardTrend,
  type AssetType,
  type DashboardSummary,
  type DashboardTrend,
  type DashboardTrendPoint,
  type TrendPeriod,
} from '../api/portfolio'
import { getErrorMessage } from '../utils/errorMessage'

const assetTypeLabels: Record<AssetType, string> = {
  STOCK: 'Stocks',
  BOND: 'Bonds',
  MUTUAL_FUND: 'Mutual funds',
}

const assetTypes: AssetType[] = ['STOCK', 'BOND', 'MUTUAL_FUND']

const emptySummary: DashboardSummary = {
  total_current_value: '0',
  total_cost_basis: '0',
  total_gain_loss: '0',
  total_performance_percentage: '0',
  asset_type_summary: [],
}

const emptyTrend: DashboardTrend = {
  period: 'ALL',
  points: [],
}

const trendPeriods: TrendPeriod[] = ['1M', 'YTD', 'ALL']

function formatCurrency(value: string) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(Number(value))
}

function formatPercent(value: string) {
  return `${Number(value).toFixed(2)}%`
}

function formatCompactCurrency(value: number) {
  if (Math.abs(value) < 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }

  return new Intl.NumberFormat('en-US', {
    compactDisplay: 'short',
    currency: 'USD',
    maximumFractionDigits: 1,
    notation: 'compact',
    style: 'currency',
  }).format(value)
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

function valueTone(value: string) {
  const numberValue = Number(value)

  if (numberValue > 0) {
    return 'positive'
  }

  if (numberValue < 0) {
    return 'negative'
  }

  return 'neutral'
}

function toneClass(tone: string) {
  if (tone === 'positive') {
    return 'text-[#00B37A]'
  }

  if (tone === 'negative') {
    return 'text-[#E34855]'
  }

  return 'text-(--text-primary)'
}

function assetSummaryByType(summary: DashboardSummary) {
  return new Map(
    summary.asset_type_summary.map((assetSummary) => [
      assetSummary.asset_type,
      assetSummary,
    ]),
  )
}

type SvgPoint = DashboardTrendPoint & {
  x: number
  y: number
  numericValue: number
}

const CHART_VIEWBOX_WIDTH = 440
const CHART_VIEWBOX_HEIGHT = 280
const CHART_LEFT = 24
const CHART_RIGHT = 16
const CHART_TOP = 16
const CHART_BOTTOM = 34
const CHART_WIDTH = CHART_VIEWBOX_WIDTH - CHART_LEFT - CHART_RIGHT
const CHART_HEIGHT = CHART_VIEWBOX_HEIGHT - CHART_TOP - CHART_BOTTOM
const CHART_BASELINE_Y = CHART_TOP + CHART_HEIGHT

function scaleTrendPoints(points: DashboardTrendPoint[]): SvgPoint[] {
  const values = points.map((point) => Number(point.value))
  const maxValue = Math.max(...values, 1)
  const minValue = Math.min(...values, 0)
  const range = Math.max(maxValue - minValue, 1)

  return points.map((point, index) => ({
    ...point,
    numericValue: Number(point.value),
    x: CHART_LEFT + (index * CHART_WIDTH) / Math.max(points.length - 1, 1),
    y:
      CHART_TOP +
      CHART_HEIGHT -
      ((Number(point.value) - minValue) / range) * CHART_HEIGHT,
  }))
}

function buildSmoothPath(points: SvgPoint[]) {
  if (points.length === 0) {
    return ''
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }

    const previousPoint = points[index - 1]
    const controlDistance = (point.x - previousPoint.x) / 2
    return [
      path,
      `C ${previousPoint.x + controlDistance} ${previousPoint.y}`,
      `${point.x - controlDistance} ${point.y}`,
      `${point.x} ${point.y}`,
    ].join(' ')
  }, '')
}

function buildAreaPath(points: SvgPoint[]) {
  if (points.length === 0) {
    return ''
  }

  const curvePath = buildSmoothPath(points)
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  return `${curvePath} L ${lastPoint.x} ${CHART_BASELINE_Y} L ${firstPoint.x} ${CHART_BASELINE_Y} Z`
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [trend, setTrend] = useState<DashboardTrend>(emptyTrend)
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isTrendLoading, setIsTrendLoading] = useState(true)
  const [error, setError] = useState('')
  const [trendError, setTrendError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSummary() {
      setIsLoading(true)
      setError('')

      try {
        const dashboardSummary = await getDashboardSummary()
        if (isMounted) {
          setSummary(dashboardSummary)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            getErrorMessage(loadError, 'Unable to load dashboard summary.'),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSummary()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadTrend() {
      setIsTrendLoading(true)
      setTrendError('')

      try {
        const dashboardTrend = await getDashboardTrend(selectedPeriod)
        if (isMounted) {
          setTrend(dashboardTrend)
        }
      } catch (loadError) {
        if (isMounted) {
          setTrendError(
            getErrorMessage(loadError, 'Unable to load portfolio trend.'),
          )
        }
      } finally {
        if (isMounted) {
          setIsTrendLoading(false)
        }
      }
    }

    void loadTrend()

    return () => {
      isMounted = false
    }
  }, [selectedPeriod])

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total current value',
        tone: 'neutral',
        value: formatCurrency(summary.total_current_value),
      },
      {
        label: 'Total cost basis',
        tone: 'neutral',
        value: formatCurrency(summary.total_cost_basis),
      },
      {
        label: 'Total gain/loss',
        tone: valueTone(summary.total_gain_loss),
        value: formatCurrency(summary.total_gain_loss),
      },
      {
        label: 'Total performance',
        tone: valueTone(summary.total_performance_percentage),
        value: formatPercent(summary.total_performance_percentage),
      },
    ],
    [summary],
  )
  const assetLookup = useMemo(() => assetSummaryByType(summary), [summary])
  const totalCurrentValue = Number(summary.total_current_value)
  const hasInvestments = totalCurrentValue > 0 || summary.asset_type_summary.length > 0

  return (
    <section className="grid gap-3">
      <div className="flex flex-col justify-between gap-3 border-b border-(--border) pb-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--text-muted)">
            Account overview
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-(--text-primary)">
            Portfolio overview
          </h2>
        </div>
      </div>

      {isLoading ? (
        <StatusPanel message="Loading dashboard summary..." />
      ) : error ? (
        <StatusPanel message={error} tone="error" />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                className="rounded-[2px] border border-(--border-soft) bg-(--panel-bg) p-4"
                key={card.label}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-(--text-muted)">
                  {card.label}
                </p>
                <p
                  className={[
                    'mt-2 text-2xl font-semibold tabular-nums',
                    toneClass(card.tone),
                  ].join(' ')}
                >
                  {card.value}
                </p>
                <p className="mt-2 text-[11px] text-(--text-subtle)">
                  Live from portfolio transactions
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
            <div className="rounded-[2px] border border-(--border-soft) bg-(--panel-bg)">
              <div className="flex flex-col gap-3 border-b border-(--border-soft) px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <h3 className="text-sm font-semibold text-(--text-primary)">
                  Portfolio trend
                </h3>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="text-[11px] text-(--text-subtle)">
                    Performance path
                  </span>
                  <div className="flex gap-1">
                    {trendPeriods.map((period) => (
                      <button
                        aria-pressed={selectedPeriod === period}
                        className={[
                          'rounded-[2px] px-3 py-1.5 text-[11px] font-bold transition',
                          selectedPeriod === period
                            ? 'bg-[#FF7A1A] text-white'
                            : 'bg-(--panel-alt) text-(--text-muted) hover:text-(--text-primary)',
                        ].join(' ')}
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        type="button"
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <PortfolioTrend
                isLoading={isTrendLoading}
                summary={summary}
                trend={trend}
                trendError={trendError}
              />
            </div>

            <div className="rounded-[2px] border border-(--border-soft) bg-(--panel-bg)">
              <div className="border-b border-(--border-soft) px-4 py-2">
                <h3 className="text-sm font-semibold text-(--text-primary)">
                  Asset allocation
                </h3>
              </div>
              <div className="space-y-4 p-4">
                {assetTypes.map((assetType) => {
                  const assetSummary = assetLookup.get(assetType)
                  const currentValue = Number(assetSummary?.current_value ?? 0)
                  const width =
                    totalCurrentValue > 0
                      ? `${Math.round((currentValue / totalCurrentValue) * 100)}%`
                      : '0%'

                  return (
                    <div key={assetType}>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-(--text-muted)">
                          {assetTypeLabels[assetType]}
                        </span>
                        <span className="font-semibold tabular-nums text-(--text-primary)">
                          {formatCurrency(assetSummary?.current_value ?? '0')}
                        </span>
                      </div>
                      <div className="h-1.5 bg-(--panel-alt)">
                        <div
                          className="h-full bg-[#00A3B5]"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  )
                })}
                {!hasInvestments ? (
                  <div className="rounded-[2px] bg-(--panel-alt) p-4 text-center">
                    <h4 className="text-sm font-semibold text-(--text-primary)">
                      No investments yet
                    </h4>
                    <p className="mt-1 text-xs text-(--text-muted)">
                      Add holdings to populate terminal panels.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function PortfolioTrend({
  isLoading,
  summary,
  trend,
  trendError,
}: {
  isLoading: boolean
  summary: DashboardSummary
  trend: DashboardTrend
  trendError: string
}) {
  const gainLoss = Number(summary.total_gain_loss)
  const points = trend.points.length
    ? trend.points
    : [
        {
          cost_basis: summary.total_cost_basis,
          date: new Date().toISOString().slice(0, 10),
          value: summary.total_current_value,
        },
      ]
  const trendPoints = scaleTrendPoints(points)
  const curvePath = buildSmoothPath(trendPoints)
  const areaPath = buildAreaPath(trendPoints)
  const currentPoint = trendPoints.at(-1)
  const values = trendPoints.map((point) => point.numericValue)
  const maxValue = Math.max(...values, 1)
  const minValue = Math.min(...values, 0)
  const firstPoint = trendPoints[0]

  return (
    <div className="relative px-2 pb-2 pt-1 sm:px-3 sm:pb-3">
      <svg
        aria-label="Portfolio performance chart"
        className="h-80 w-full"
        role="img"
        viewBox={`0 0 ${CHART_VIEWBOX_WIDTH} ${CHART_VIEWBOX_HEIGHT}`}
      >
        <defs>
          <linearGradient id="portfolioTrendArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00B37A" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#00B37A" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((index) => {
          const y = CHART_TOP + (CHART_HEIGHT / 3) * index
          const labelValue = maxValue - ((maxValue - minValue) / 3) * index
          return (
            <g key={y}>
              <line
                stroke="var(--border-soft)"
                strokeDasharray="4 8"
                x1={CHART_LEFT}
                x2={CHART_LEFT + CHART_WIDTH}
                y1={y}
                y2={y}
              />
              <text
                fill="var(--text-subtle)"
                fontSize="10"
                textAnchor="end"
                x={CHART_LEFT - 8}
                y={y + 4}
              >
                {formatCompactCurrency(labelValue)}
              </text>
            </g>
          )
        })}
        <line
          stroke="var(--text-subtle)"
          strokeWidth="1.5"
          x1={CHART_LEFT}
          x2={CHART_LEFT}
          y1={CHART_TOP}
          y2={CHART_BASELINE_Y}
        />
        <line
          stroke="var(--text-subtle)"
          strokeWidth="1.5"
          x1={CHART_LEFT}
          x2={CHART_LEFT + CHART_WIDTH}
          y1={CHART_BASELINE_Y}
          y2={CHART_BASELINE_Y}
        />
        <path d={areaPath} fill="url(#portfolioTrendArea)" />
        <path
          data-testid="portfolio-trend-curve"
          d={curvePath}
          fill="none"
          stroke={gainLoss >= 0 ? '#00B37A' : '#E34855'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        {trendPoints.map((point, index) => (
          <circle
            cx={point.x}
            cy={point.y}
            fill={index === trendPoints.length - 1 ? '#FF7A1A' : 'var(--panel-bg)'}
            key={`${point.date}-${point.value}`}
            r={index === trendPoints.length - 1 ? '6' : '4'}
            stroke={gainLoss >= 0 ? '#00B37A' : '#E34855'}
            strokeWidth="3"
          />
        ))}
        {currentPoint ? (
          <g key="current-point-label">
            <line
              stroke="#FF7A1A"
              strokeDasharray="3 7"
              x1={currentPoint.x}
              x2={currentPoint.x}
              y1={currentPoint.y}
              y2={CHART_BASELINE_Y}
            />
            <text
              fill="var(--text-muted)"
              fontSize="11"
              textAnchor="end"
              x={currentPoint.x}
              y={CHART_BASELINE_Y + 20}
            >
              {formatChartDate(currentPoint.date)}
            </text>
          </g>
        ) : null}
        {firstPoint && firstPoint.date !== currentPoint?.date ? (
          <text
            fill="var(--text-muted)"
            fontSize="11"
            textAnchor="start"
            x={firstPoint.x}
            y={CHART_BASELINE_Y + 20}
          >
            {formatChartDate(firstPoint.date)}
          </text>
        ) : null}
      </svg>
      {isLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-(--panel-bg)/70">
          <span className="rounded-[2px] border border-(--border-soft) bg-(--panel-bg) px-3 py-1 text-xs text-(--text-muted)">
            Loading portfolio trend...
          </span>
        </div>
      ) : null}
      {trendError ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-[2px] border border-[#E34855]/30 bg-[#E34855]/10 px-3 py-2 text-xs text-[#E34855]">
          {trendError}
        </div>
      ) : null}
    </div>
  )
}

function StatusPanel({
  message,
  tone = 'neutral',
}: {
  message: string
  tone?: 'neutral' | 'error'
}) {
  return (
    <div
      className={[
        'rounded-[2px] border px-4 py-8 text-center text-sm',
        tone === 'error'
          ? 'border-[#E34855]/30 bg-[#E34855]/10 text-[#E34855]'
          : 'border-(--border-soft) bg-(--panel-bg) text-(--text-muted)',
      ].join(' ')}
    >
      {message}
    </div>
  )
}
