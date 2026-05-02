import { apiClient } from './client'

export type AssetType = 'STOCK' | 'BOND' | 'MUTUAL_FUND'
export type TransactionType = 'BUY' | 'SELL'
export type TrendPeriod = '1D' | '1M' | 'YTD' | 'ALL'

export type DashboardSummary = {
  total_current_value: string
  total_cost_basis: string
  total_gain_loss: string
  total_performance_percentage: string
  asset_type_summary: AssetTypeSummary[]
}

export type DashboardTrendPoint = {
  date: string
  value: string
  cost_basis: string
}

export type DashboardTrend = {
  period: TrendPeriod
  points: DashboardTrendPoint[]
}

export type AssetTypeSummary = {
  asset_type: AssetType
  current_value: string
  cost_basis: string
  gain_loss: string
}

export type Investment = {
  id: string
  name: string
  symbol: string
  asset_type: AssetType
  current_price: string
  current_quantity: string
  average_buy_price: string
  estimated_cost_basis: string
  current_value: string
  gain_loss: string
  performance_percentage: string
}

export type InvestmentCreatePayload = {
  name: string
  symbol: string
  asset_type: AssetType
  current_price: string
  initial_quantity: string
  initial_purchase_price: string
  transaction_date: string
}

export type InvestmentUpdatePayload = {
  name: string
  symbol: string
  asset_type: AssetType
  current_price: string
}

export type Transaction = {
  id: string
  investment_id: string
  investment_symbol: string
  transaction_type: TransactionType
  quantity: string
  price: string
  transaction_date: string
}

export type TransactionCreatePayload = {
  investment_id: string
  transaction_type: TransactionType
  quantity: string
  price: string
  transaction_date: string
}

export type TransactionUpdatePayload = {
  transaction_type: TransactionType
  quantity: string
  price: string
  transaction_date: string
}

export async function getDashboardSummary() {
  const response = await apiClient.get<DashboardSummary>('/dashboard/summary')
  return response.data
}

export async function getDashboardTrend(period: TrendPeriod) {
  const response = await apiClient.get<DashboardTrend>('/dashboard/trend', {
    params: { period },
  })
  return response.data
}

export async function listInvestments() {
  const response = await apiClient.get<Investment[]>('/investments')
  return response.data
}

export async function createInvestment(payload: InvestmentCreatePayload) {
  const response = await apiClient.post<Investment>('/investments', payload)
  return response.data
}

export async function updateInvestment(
  investmentId: string,
  payload: InvestmentUpdatePayload,
) {
  const response = await apiClient.put<Investment>(
    `/investments/${investmentId}`,
    payload,
  )
  return response.data
}

export async function deleteInvestment(investmentId: string) {
  await apiClient.delete(`/investments/${investmentId}`)
}

export async function listTransactions() {
  const response = await apiClient.get<Transaction[]>('/transactions')
  return response.data
}

export async function createTransaction(payload: TransactionCreatePayload) {
  const response = await apiClient.post<Transaction>('/transactions', payload)
  return response.data
}

export async function updateTransaction(
  transactionId: string,
  payload: TransactionUpdatePayload,
) {
  const response = await apiClient.put<Transaction>(
    `/transactions/${transactionId}`,
    payload,
  )
  return response.data
}

export async function deleteTransaction(transactionId: string) {
  await apiClient.delete(`/transactions/${transactionId}`)
}
