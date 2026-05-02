function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Portfolio Management Dashboard
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Track holdings, transactions, and portfolio performance.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          React, FastAPI, PostgreSQL, and Docker Compose foundation is ready.
          Authentication, portfolio data, and dashboard workflows will be added
          in the next build tasks.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {['React + TypeScript', 'FastAPI Backend', 'PostgreSQL Ledger'].map(
            (label) => (
              <div
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                key={label}
              >
                <p className="font-medium text-slate-100">{label}</p>
              </div>
            ),
          )}
        </div>
      </section>
    </main>
  )
}

export default App
