export function TransactionsPage() {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Ledger
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Transactions
          </h2>
        </div>
        <button
          className="rounded-[2px] bg-[#FF7A1A] px-4 py-2 text-xs font-bold text-white"
          type="button"
        >
          Add transaction
        </button>
      </div>

      <div className="rounded-[2px] border border-[var(--border-soft)] bg-[var(--panel-bg)]">
        <div className="grid grid-cols-5 border-b border-[var(--border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
          <span>Date</span>
          <span>Symbol</span>
          <span>Type</span>
          <span className="text-right">Quantity</span>
          <span className="text-right">Price</span>
        </div>
        <div className="flex min-h-72 items-center justify-center px-4 py-10 text-center">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              No transactions available
            </h3>
            <p className="mt-2 max-w-md text-xs leading-5 text-[var(--text-muted)]">
              The transaction ledger, buy/sell form, edit flow, and sell validation
              messages will be completed in the frontend pages task.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
