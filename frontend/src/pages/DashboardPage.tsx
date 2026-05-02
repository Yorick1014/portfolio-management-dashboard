import { useEffect, useMemo, useState } from 'react'
import {
  getDashboardSummary,
  type AssetType,
  type DashboardSummary,
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

function formatCurrency(value: string) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(Number(value))
}

function formatPercent(value: string) {
  return `${Number(value).toFixed(2)}%`
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

  return 'text-[var(--text-primary)]'
}

function assetSummaryByType(summary: DashboardSummary) {
  return new Map(
    summary.asset_type_summary.map((assetSummary) => [
      assetSummary.asset_type,
      assetSummary,
    ]),
  )
}

function chartPoint(value: number, maxValue: number, index: number) {
  const x = 40 + index * 140
  const safeMax = maxValue > 0 ? maxValue : 1
  const y = 200 - Math.round((value / safeMax) * 140)

  return `${x},${y}`
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Account overview
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
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
                className="rounded-[2px] border border-[var(--border-soft)] bg-[var(--panel-bg)] p-4"
                key={card.label}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
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
                <p className="mt-2 text-[11px] text-[var(--text-subtle)]">
                  Live from portfolio transactions
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
            <div className="rounded-[2px] border border-[var(--border-soft)] bg-[var(--panel-bg)]">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Portfolio trend
                </h3>
                <span className="text-[11px] text-[var(--text-subtle)]">
                  Performance path
                </span>
              </div>
              <PortfolioTrend summary={summary} />
            </div>

            <div className="rounded-[2px] border border-[var(--border-soft)] bg-[var(--panel-bg)]">
              <div className="border-b border-[var(--border-soft)] px-4 py-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
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
                        <span className="text-[var(--text-muted)]">
                          {assetTypeLabels[assetType]}
                        </span>
                        <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                          {formatCurrency(assetSummary?.current_value ?? '0')}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[var(--panel-alt)]">
                        <div
                          className="h-full bg-[#00A3B5]"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  )
                })}
                {!hasInvestments ? (
                  <div className="rounded-[2px] bg-[var(--panel-alt)] p-4 text-center">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      No investments yet
                    </h4>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
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

function PortfolioTrend({ summary }: { summary: DashboardSummary }) {
  const costBasis = Number(summary.total_cost_basis)
  const currentValue = Number(summary.total_current_value)
  const gainLoss = Number(summary.total_gain_loss)
  const maxValue = Math.max(costBasis, currentValue, Math.abs(gainLoss), 1)
  const points = [
    chartPoint(costBasis, maxValue, 0),
    chartPoint((costBasis + currentValue) / 2, maxValue, 1),
    chartPoint(currentValue, maxValue, 2),
  ].join(' ')

  return (
    <div className="p-4">
      <svg
        aria-label="Portfolio performance chart"
        className="h-64 w-full"
        role="img"
        viewBox="0 0 360 240"
      >
        <line stroke="var(--border-soft)" x1="24" x2="336" y1="60" y2="60" />
        <line stroke="var(--border-soft)" x1="24" x2="336" y1="120" y2="120" />
        <line stroke="var(--border-soft)" x1="24" x2="336" y1="180" y2="180" />
        <polyline
          fill="none"
          points={points}
          stroke={gainLoss >= 0 ? '#00B37A' : '#E34855'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {points.split(' ').map((point) => {
          const [cx, cy] = point.split(',')
          return (
            <circle
              cx={cx}
              cy={cy}
              fill="#FF7A1A"
              key={point}
              r="5"
              stroke="var(--panel-bg)"
              strokeWidth="3"
            />
          )
        })}
      </svg>
      <div className="grid gap-2 text-xs sm:grid-cols-3">
        <TrendMetric label="Cost basis" value={formatCurrency(summary.total_cost_basis)} />
        <TrendMetric
          label="Current value"
          value={formatCurrency(summary.total_current_value)}
        />
        <TrendMetric
          label="Net change"
          tone={gainLoss >= 0 ? 'positive' : 'negative'}
          value={formatCurrency(summary.total_gain_loss)}
        />
      </div>
    </div>
  )
}

function TrendMetric({
  label,
  tone = 'neutral',
  value,
}: {
  label: string
  tone?: 'neutral' | 'positive' | 'negative'
  value: string
}) {
  return (
    <div className="rounded-[2px] bg-[var(--panel-alt)] p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
        {label}
      </p>
      <p className={['mt-1 font-semibold tabular-nums', toneClass(tone)].join(' ')}>
        {value}
      </p>
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
          : 'border-[var(--border-soft)] bg-[var(--panel-bg)] text-[var(--text-muted)]',
      ].join(' ')}
    >
      {message}
    </div>
  )
}
