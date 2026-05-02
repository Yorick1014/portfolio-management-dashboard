import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  createTransaction,
  deleteTransaction,
  listInvestments,
  listTransactions,
  updateTransaction,
  type Investment,
  type Transaction,
  type TransactionCreatePayload,
  type TransactionType,
  type TransactionUpdatePayload,
} from '../api/portfolio'
import { getErrorMessage } from '../utils/errorMessage'

const emptyForm = {
  investment_id: '',
  price: '',
  quantity: '',
  transaction_date: '',
  transaction_type: 'BUY' as TransactionType,
}

type TransactionFormState = typeof emptyForm
type FormMode = { type: 'create' } | { type: 'edit'; transaction: Transaction }

function formatCurrency(value: string) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(Number(value))
}

function formatQuantity(value: string) {
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  })
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function getTodayDate() {
  return new Date().toLocaleDateString('en-CA')
}

function clampDateYear(value: string) {
  const match = value.match(/^(\d{4,})(-\d{2}-\d{2})$/)

  if (!match) {
    return value
  }

  return `${match[1].slice(0, 4)}${match[2]}`
}

function buildEditForm(transaction: Transaction): TransactionFormState {
  return {
    investment_id: transaction.investment_id,
    price: transaction.price,
    quantity: transaction.quantity,
    transaction_date: transaction.transaction_date,
    transaction_type: transaction.transaction_type,
  }
}

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [form, setForm] = useState<TransactionFormState>(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditing = formMode?.type === 'edit'

  useEffect(() => {
    void loadPageData()
  }, [])

  async function loadPageData() {
    setIsLoading(true)
    setError('')

    try {
      const nextTransactions = await listTransactions()
      const nextInvestments = await listInvestments()
      setTransactions(nextTransactions)
      setInvestments(nextInvestments)
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Unable to load transactions.'))
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    setFormMode({ type: 'create' })
    setForm({
      ...emptyForm,
      investment_id: investments[0]?.id ?? '',
      transaction_date: getTodayDate(),
    })
    setFormError('')
  }

  function openEditForm(transaction: Transaction) {
    setFormMode({ type: 'edit', transaction })
    setForm(buildEditForm(transaction))
    setFormError('')
  }

  function closeForm() {
    setFormMode(null)
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSuccess('')
    setDeleteSuccess('')
    setIsSaving(true)

    try {
      if (isEditing) {
        const payload: TransactionUpdatePayload = {
          price: form.price,
          quantity: form.quantity,
          transaction_date: form.transaction_date,
          transaction_type: form.transaction_type,
        }
        await updateTransaction(formMode.transaction.id, payload)
      } else {
        const payload: TransactionCreatePayload = {
          investment_id: form.investment_id,
          price: form.price,
          quantity: form.quantity,
          transaction_date: form.transaction_date,
          transaction_type: form.transaction_type,
        }
        await createTransaction(payload)
      }

      closeForm()
      setSuccess('Transaction saved.')
      await loadPageData()
    } catch (submitError) {
      setFormError(getErrorMessage(submitError, 'Unable to save transaction.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setIsDeleting(true)
    setError('')
    setSuccess('')
    setDeleteSuccess('')

    try {
      await deleteTransaction(deleteTarget.id)
      setDeleteTarget(null)
      setDeleteSuccess('Transaction deleted.')
      await loadPageData()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Unable to delete transaction.'))
    } finally {
      setIsDeleting(false)
    }
  }

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
          onClick={openCreateForm}
          type="button"
        >
          Add transaction
        </button>
      </div>

      {success ? <Message tone="success">{success}</Message> : null}
      {error ? <Message tone="error">{error}</Message> : null}
      {deleteSuccess ? (
        <SuccessModal
          message={deleteSuccess}
          onClose={() => setDeleteSuccess('')}
          title="Transaction deleted"
        />
      ) : null}

      {formMode ? (
        <Modal onClose={closeForm} titleId="transaction-form-title">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {isEditing ? 'Edit ledger entry' : 'New ledger entry'}
              </p>
              <h3
                className="mt-1 text-sm font-semibold text-[var(--text-primary)]"
                id="transaction-form-title"
              >
                {isEditing ? 'Update transaction' : 'Add buy or sell transaction'}
              </h3>
            </div>
            <button
              className="rounded-[2px] bg-[var(--panel-alt)] px-3 py-2 text-xs font-bold text-[var(--text-muted)]"
              onClick={closeForm}
              type="button"
            >
              Cancel
            </button>
          </div>
          {formError ? <Message tone="error">{formError}</Message> : null}
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Investment
              <select
                className="mt-2 w-full rounded-[2px] bg-[var(--panel-alt)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[#FF7A1A] disabled:opacity-60"
                disabled={isEditing}
                onChange={(event) =>
                  setForm({ ...form, investment_id: event.target.value })
                }
                required
                value={form.investment_id}
              >
                <option value="">Select investment</option>
                {investments.map((investment) => (
                  <option key={investment.id} value={investment.id}>
                    {investment.symbol}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Transaction type
              <select
                className="mt-2 w-full rounded-[2px] bg-[var(--panel-alt)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[#FF7A1A]"
                onChange={(event) =>
                  setForm({
                    ...form,
                    transaction_type: event.target.value as TransactionType,
                  })
                }
                value={form.transaction_type}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </label>
            <FormField
              inputMode="decimal"
              label="Quantity"
              onChange={(value) => setForm({ ...form, quantity: value })}
              value={form.quantity}
            />
            <FormField
              inputMode="decimal"
              label="Price"
              onChange={(value) => setForm({ ...form, price: value })}
              value={form.price}
            />
            <FormField
              label="Transaction date"
              max="9999-12-31"
              onChange={(value) =>
                setForm({ ...form, transaction_date: clampDateYear(value) })
              }
              type="date"
              value={form.transaction_date}
            />
            <div className="flex items-end">
              <button
                className="w-full rounded-[2px] bg-[#FF7A1A] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-[#687284]"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Saving...' : 'Save transaction'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      <div className="rounded-[2px] border border-[var(--border-soft)] bg-[var(--panel-bg)]">
        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center px-4 py-10 text-center">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                No transactions available
              </h3>
              <p className="mt-2 max-w-md text-xs leading-5 text-[var(--text-muted)]">
                Add buy and sell activity to keep portfolio quantity and cost
                basis accurate.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="hidden grid-cols-7 border-b border-[var(--border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)] lg:grid">
                <span>Date</span>
                <span>Investment symbol</span>
                <span>Type</span>
                <span className="text-right">Quantity</span>
                <span className="text-right">Price</span>
                <span className="text-right">Total amount</span>
                <span className="text-right">Actions</span>
              </div>
              {transactions.map((transaction) => (
                <div
                  className="grid gap-2 border-b border-[var(--border-soft)] p-4 text-xs last:border-b-0 lg:grid-cols-7 lg:items-center lg:px-4 lg:py-3"
                  key={transaction.id}
                >
                  <ResponsiveCell label="Date">
                    {formatDate(transaction.transaction_date)}
                  </ResponsiveCell>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {transaction.investment_symbol}
                  </span>
                  <span
                    className={
                      transaction.transaction_type === 'BUY'
                        ? 'font-semibold text-[#00B37A]'
                        : 'font-semibold text-[#E34855]'
                    }
                  >
                    <span className="font-semibold text-[var(--text-subtle)] lg:hidden">
                      Type
                    </span>
                    <span>{transaction.transaction_type}</span>
                  </span>
                  <ResponsiveCell align="right" label="Quantity">
                    {formatQuantity(transaction.quantity)}
                  </ResponsiveCell>
                  <ResponsiveCell align="right" label="Price">
                    {formatCurrency(transaction.price)}
                  </ResponsiveCell>
                  <ResponsiveCell align="right" label="Total amount">
                    {formatCurrency(
                      String(
                        Number(transaction.quantity) * Number(transaction.price),
                      ),
                    )}
                  </ResponsiveCell>
                  <span className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      aria-label={`Edit ${transaction.transaction_type} ${transaction.investment_symbol}`}
                      className="rounded-[2px] bg-[var(--panel-alt)] px-2 py-1 font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      onClick={() => openEditForm(transaction)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${transaction.transaction_type} ${transaction.investment_symbol}`}
                      className="rounded-[2px] bg-[#E34855]/10 px-2 py-1 font-bold text-[#E34855]"
                      onClick={() => setDeleteTarget(transaction)}
                      type="button"
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {deleteTarget ? (
        <ConfirmPanel
          confirmLabel={isDeleting ? 'Deleting...' : 'Confirm delete'}
          isBusy={isDeleting}
          message={`Delete this transaction for ${deleteTarget.investment_symbol}?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete transaction?"
        />
      ) : null}
    </section>
  )
}

function FormField({
  inputMode,
  label,
  max,
  onChange,
  type = 'text',
  value,
}: {
  inputMode?: 'decimal'
  label: string
  max?: string
  onChange: (value: string) => void
  type?: string
  value: string
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
      {label}
      <input
        className="mt-2 w-full rounded-[2px] bg-[var(--panel-alt)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[#FF7A1A]"
        inputMode={inputMode}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  )
}

function Modal({
  children,
  onClose,
  titleId,
}: {
  children: ReactNode
  onClose: () => void
  titleId: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2px] border border-[var(--border-soft)] bg-[var(--panel-bg)] p-4 shadow-2xl"
        role="dialog"
      >
        {children}
      </div>
      <button
        aria-label="Close modal"
        className="absolute inset-0 -z-10 cursor-default"
        onClick={onClose}
        type="button"
      />
    </div>
  )
}

function ResponsiveCell({
  align = 'left',
  children,
  label,
}: {
  align?: 'left' | 'right'
  children: ReactNode
  label: string
}) {
  return (
    <span
      className={[
        'flex justify-between gap-4 tabular-nums lg:block',
        align === 'right' ? 'lg:text-right' : '',
      ].join(' ')}
    >
      <span className="font-semibold text-[var(--text-subtle)] lg:hidden">
        {label}
      </span>
      <span>{children}</span>
    </span>
  )
}

function Message({
  children,
  tone,
}: {
  children: string
  tone: 'success' | 'error'
}) {
  return (
    <p
      className={[
        'rounded-[2px] px-4 py-3 text-sm',
        tone === 'success'
          ? 'bg-[#00B37A]/10 text-[#00B37A]'
          : 'bg-[#E34855]/10 text-[#E34855]',
      ].join(' ')}
    >
      {children}
    </p>
  )
}

function SuccessModal({
  message,
  onClose,
  title,
}: {
  message: string
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        aria-labelledby="transaction-delete-success-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[2px] border border-[#00B37A]/30 bg-[var(--panel-bg)] p-5 shadow-2xl"
        role="dialog"
      >
        <h3
          className="text-sm font-semibold text-[var(--text-primary)]"
          id="transaction-delete-success-title"
        >
          {title}
        </h3>
        <p className="mt-2 text-sm text-[#00B37A]">{message}</p>
        <button
          className="mt-4 rounded-[2px] bg-[#00B37A] px-4 py-2 text-xs font-bold text-white"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function ConfirmPanel({
  confirmLabel,
  isBusy,
  message,
  onCancel,
  onConfirm,
  title,
}: {
  confirmLabel: string
  isBusy: boolean
  message: string
  onCancel: () => void
  onConfirm: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        aria-labelledby="transaction-delete-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[2px] border border-[#E34855]/30 bg-[var(--panel-bg)] p-5 shadow-2xl"
        role="dialog"
      >
        <h3
          className="text-sm font-semibold text-[var(--text-primary)]"
          id="transaction-delete-title"
        >
          {title}
        </h3>
        <p className="mt-2 text-sm text-[#E34855]">{message}</p>
        <div className="mt-4 flex gap-2">
          <button
            className="rounded-[2px] bg-[#E34855] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-[#687284]"
            disabled={isBusy}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
          <button
            className="rounded-[2px] bg-[var(--panel-alt)] px-4 py-2 text-xs font-bold text-[var(--text-muted)]"
            disabled={isBusy}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
