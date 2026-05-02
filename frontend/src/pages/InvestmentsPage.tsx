export function InvestmentsPage() {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Holdings
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Investments
          </h2>
        </div>
        <button
          className="rounded-[2px] bg-[#FF7A1A] px-4 py-2 text-xs font-bold text-white"
          type="button"
        >
          Add investment
        </button>
      </div>

      <div className="rounded-[2px] border border-[var(--border-soft)] bg-[var(--panel-bg)]">
        <div className="grid grid-cols-4 border-b border-[var(--border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
          <span>Name</span>
          <span>Symbol</span>
          <span className="text-right">Market value</span>
          <span className="text-right">Gain/Loss</span>
        </div>
        <div className="flex min-h-72 items-center justify-center px-4 py-10 text-center">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              No holdings available
            </h3>
            <p className="mt-2 max-w-md text-xs leading-5 text-[var(--text-muted)]">
              The dense holdings table, metadata form, current price updates, and
              delete confirmation will be completed in the frontend pages task.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
