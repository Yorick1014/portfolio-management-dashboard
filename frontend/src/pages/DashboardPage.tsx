const summaryCards = [
  { label: 'Market value', tone: 'neutral', value: '$0.00' },
  { label: 'Cost basis', tone: 'neutral', value: '$0.00' },
  { label: 'Unrealized P/L', tone: 'positive', value: '$0.00' },
  { label: 'Return', tone: 'negative', value: '0.00%' },
]

const assetRows = [
  { label: 'Stocks', value: '0.00%', width: 'w-[72%]' },
  { label: 'Bonds', value: '0.00%', width: 'w-[42%]' },
  { label: 'Mutual funds', value: '0.00%', width: 'w-[56%]' },
]

export function DashboardPage() {
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
        <div className="flex gap-1 text-xs">
          {['1D', '1M', 'YTD', 'ALL'].map((range) => (
            <button
              className="rounded-[2px] bg-[var(--panel-alt)] px-3 py-1.5 font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              key={range}
              type="button"
            >
              {range}
            </button>
          ))}
        </div>
      </div>

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
                card.tone === 'positive'
                  ? 'text-[#00B37A]'
                  : card.tone === 'negative'
                    ? 'text-[#E34855]'
                    : 'text-[var(--text-primary)]',
              ].join(' ')}
            >
              {card.value}
            </p>
            <p className="mt-2 text-[11px] text-[var(--text-subtle)]">
              Awaiting portfolio data
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
              Chart placeholder
            </span>
          </div>
          <div className="flex h-72 items-center justify-center">
            <div className="w-full px-8">
              <div className="h-px bg-[var(--border-soft)]" />
              <div className="mt-8 h-px bg-[var(--border-soft)]" />
              <div className="mt-8 h-px bg-[var(--border-soft)]" />
              <div className="mt-8 h-px bg-[var(--border-soft)]" />
              <div className="mt-8 h-px bg-[var(--border-soft)]" />
              <p className="mt-6 text-center text-xs text-[var(--text-subtle)]">
                Dashboard chart data will connect in the frontend pages task.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2px] border border-[var(--border-soft)] bg-[var(--panel-bg)]">
          <div className="border-b border-[var(--border-soft)] px-4 py-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Asset allocation
            </h3>
          </div>
          <div className="space-y-4 p-4">
            {assetRows.map((row) => (
              <div key={row.label}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">{row.label}</span>
                  <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                    {row.value}
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--panel-alt)]">
                  <div className={`${row.width} h-full bg-[#00A3B5]`} />
                </div>
              </div>
            ))}
            <div className="rounded-[2px] bg-[var(--panel-alt)] p-4 text-center">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                No investments yet
              </h4>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Add holdings to populate terminal panels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
