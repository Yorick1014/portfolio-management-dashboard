import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  createInvestment,
  deleteInvestment,
  listInvestments,
  updateInvestment,
  type AssetType,
  type Investment,
  type InvestmentCreatePayload,
  type InvestmentUpdatePayload,
} from '../api/portfolio'
import { getErrorMessage } from '../utils/errorMessage'

const assetTypeOptions: { label: string; value: AssetType }[] = [
  { label: 'Stock', value: 'STOCK' },
  { label: 'Bond', value: 'BOND' },
  { label: 'Mutual fund', value: 'MUTUAL_FUND' },
]

const emptyForm = {
  asset_type: 'STOCK' as AssetType,
  current_price: '',
  initial_purchase_price: '',
  initial_quantity: '',
  name: '',
  symbol: '',
  transaction_date: '',
}

type InvestmentFormState = typeof emptyForm
type FormMode = { type: 'create' } | { type: 'edit'; investment: Investment }

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

function displayAssetType(assetType: AssetType) {
  return assetTypeOptions.find((option) => option.value === assetType)?.label ?? assetType
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

function buildEditForm(investment: Investment): InvestmentFormState {
  return {
    asset_type: investment.asset_type,
    current_price: investment.current_price,
    initial_purchase_price: '',
    initial_quantity: '',
    name: investment.name,
    symbol: investment.symbol,
    transaction_date: '',
  }
}

export function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [form, setForm] = useState<InvestmentFormState>(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditing = formMode?.type === 'edit'

  useEffect(() => {
    void loadInvestments()
  }, [])

  async function loadInvestments() {
    setIsLoading(true)
    setError('')

    try {
      setInvestments(await listInvestments())
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Unable to load investments.'))
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    setFormMode({ type: 'create' })
    setForm({ ...emptyForm, transaction_date: getTodayDate() })
    setFormError('')
  }

  function openEditForm(investment: Investment) {
    setFormMode({ type: 'edit', investment })
    setForm(buildEditForm(investment))
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
        const payload: InvestmentUpdatePayload = {
          asset_type: form.asset_type,
          current_price: form.current_price,
          name: form.name,
          symbol: form.symbol,
        }
        await updateInvestment(formMode.investment.id, payload)
      } else {
        const payload: InvestmentCreatePayload = {
          asset_type: form.asset_type,
          current_price: form.current_price,
          initial_purchase_price: form.initial_purchase_price,
          initial_quantity: form.initial_quantity,
          name: form.name,
          symbol: form.symbol,
          transaction_date: form.transaction_date,
        }
        await createInvestment(payload)
      }

      closeForm()
      setSuccess('Investment saved.')
      await loadInvestments()
    } catch (submitError) {
      setFormError(getErrorMessage(submitError, 'Unable to save investment.'))
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
      await deleteInvestment(deleteTarget.id)
      setDeleteTarget(null)
      setDeleteSuccess('Investment deleted.')
      await loadInvestments()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Unable to delete investment.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const holdingsTotal = useMemo(
    () =>
      investments.reduce(
        (total, investment) => total + Number(investment.current_value),
        0,
      ),
    [investments],
  )

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
          onClick={openCreateForm}
          type="button"
        >
          Add investment
        </button>
      </div>

      {success ? <Message tone="success">{success}</Message> : null}
      {error ? <Message tone="error">{error}</Message> : null}
      {deleteSuccess ? (
        <SuccessModal
          message={deleteSuccess}
          onClose={() => setDeleteSuccess('')}
          title="Investment deleted"
        />
      ) : null}

      {formMode ? (
        <Modal onClose={closeForm} titleId="investment-form-title">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {isEditing ? 'Edit holding' : 'New holding'}
              </p>
              <h3
                className="mt-1 text-sm font-semibold text-[var(--text-primary)]"
                id="investment-form-title"
              >
                {isEditing
                  ? 'Update investment metadata'
                  : 'Create investment with opening buy'}
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
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleSubmit}>
            <FormField
              label="Name"
              onChange={(value) => setForm({ ...form, name: value })}
              value={form.name}
            />
            <FormField
              label="Symbol"
              onChange={(value) => setForm({ ...form, symbol: value })}
              value={form.symbol}
            />
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Asset type
              <select
                className="mt-2 w-full rounded-[2px] bg-[var(--panel-alt)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[#FF7A1A]"
                onChange={(event) =>
                  setForm({ ...form, asset_type: event.target.value as AssetType })
                }
                value={form.asset_type}
              >
                {assetTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <FormField
              inputMode="decimal"
              label="Current price"
              onChange={(value) => setForm({ ...form, current_price: value })}
              value={form.current_price}
            />
            {!isEditing ? (
              <>
                <FormField
                  inputMode="decimal"
                  label="Initial quantity"
                  onChange={(value) => setForm({ ...form, initial_quantity: value })}
                  value={form.initial_quantity}
                />
                <FormField
                  inputMode="decimal"
                  label="Initial purchase price"
                  onChange={(value) =>
                    setForm({ ...form, initial_purchase_price: value })
                  }
                  value={form.initial_purchase_price}
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
              </>
            ) : null}
            <div className="flex items-end">
              <button
                className="w-full rounded-[2px] bg-[#FF7A1A] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-[#687284]"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Saving...' : 'Save investment'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      <div className="rounded-[2px] border border-[var(--border-soft)] bg-[var(--panel-bg)]">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Holdings table
          </h3>
          <span className="text-[11px] text-[var(--text-subtle)]">
            Total {formatCurrency(String(holdingsTotal))}
          </span>
        </div>
        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
            Loading investments...
          </div>
        ) : investments.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center px-4 py-10 text-center">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                No holdings available
              </h3>
              <p className="mt-2 max-w-md text-xs leading-5 text-[var(--text-muted)]">
                Add an investment to create its opening buy transaction and
                populate the holdings table.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="hidden grid-cols-9 border-b border-[var(--border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)] lg:grid">
                <span>Name</span>
                <span>Symbol</span>
                <span>Asset type</span>
                <span className="text-right">Current price</span>
                <span className="text-right">Quantity</span>
                <span className="text-right">Average buy</span>
                <span className="text-right">Market value</span>
                <span className="text-right">Gain/Loss</span>
                <span className="text-right">Actions</span>
              </div>
              {investments.map((investment) => (
                <div
                  className="grid gap-2 border-b border-[var(--border-soft)] p-4 text-xs last:border-b-0 lg:grid-cols-9 lg:items-center lg:px-4 lg:py-3"
                  key={investment.id}
                >
                  <span className="font-semibold text-[var(--text-primary)]">
                    {investment.name}
                  </span>
                  <ResponsiveCell label="Symbol">{investment.symbol}</ResponsiveCell>
                  <ResponsiveCell label="Asset type">
                    {displayAssetType(investment.asset_type)}
                  </ResponsiveCell>
                  <ResponsiveCell align="right" label="Current price">
                    {formatCurrency(investment.current_price)}
                  </ResponsiveCell>
                  <ResponsiveCell align="right" label="Quantity">
                    {formatQuantity(investment.current_quantity)}
                  </ResponsiveCell>
                  <ResponsiveCell align="right" label="Average buy">
                    {formatCurrency(investment.average_buy_price)}
                  </ResponsiveCell>
                  <ResponsiveCell align="right" label="Market value">
                    {formatCurrency(investment.current_value)}
                  </ResponsiveCell>
                  <span
                    className={[
                      'flex justify-between gap-4 tabular-nums lg:block lg:text-right',
                      Number(investment.gain_loss) >= 0
                        ? 'text-[#00B37A]'
                        : 'text-[#E34855]',
                    ].join(' ')}
                  >
                    <span className="font-semibold text-[var(--text-subtle)] lg:hidden">
                      Gain/Loss
                    </span>
                    <span>{formatCurrency(investment.gain_loss)}</span>
                  </span>
                  <span className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      aria-label={`Edit ${investment.name}`}
                      className="rounded-[2px] bg-[var(--panel-alt)] px-2 py-1 font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      onClick={() => openEditForm(investment)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${investment.name}`}
                      className="rounded-[2px] bg-[#E34855]/10 px-2 py-1 font-bold text-[#E34855]"
                      onClick={() => setDeleteTarget(investment)}
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
          message={`Deleting ${deleteTarget.name} will also delete related transaction history.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete investment?"
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
        aria-labelledby="investment-delete-success-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[2px] border border-[#00B37A]/30 bg-[var(--panel-bg)] p-5 shadow-2xl"
        role="dialog"
      >
        <h3
          className="text-sm font-semibold text-[var(--text-primary)]"
          id="investment-delete-success-title"
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
        aria-labelledby="investment-delete-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[2px] border border-[#E34855]/30 bg-[var(--panel-bg)] p-5 shadow-2xl"
        role="dialog"
      >
      <h3
        className="text-sm font-semibold text-[var(--text-primary)]"
        id="investment-delete-title"
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
