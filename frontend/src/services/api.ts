import axios from 'axios'

const DEFAULT_BASE_URL = 'http://127.0.0.1:8010'
const AUTH_TOKEN_KEY = 'backend_access_token'

export const RESEARCH_WS_PATH = '/v1/research/reports/ws'

function resolveBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL
}

export function getResearchWsUrl(token: string): string {
  const base = resolveBaseUrl()
  const wsBase = base.replace(/^http/, 'ws')
  return `${wsBase}${RESEARCH_WS_PATH}?token=${encodeURIComponent(token)}`
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export type SignalType = 'BUY' | 'SELL' | 'HOLD'
export type SignalStatus = 'NEW' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED'
export type OrderStatus = 'PENDING' | 'SUBMITTED' | 'FILLED' | 'CANCELLED' | 'REJECTED'

export interface AccountSummary {
  account_id: string
  cash_balance: number
  equity: number
  base_currency?: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
  role: 'super_admin' | 'risk_manager' | 'finance_operator' | 'auditor'
  status: string
  mfa_enabled: boolean
  last_login_at: string | null
  created_at: string
}

export interface SignalIngestRequest {
  run_id: string
  symbol: string
  as_of_date: string
  signal: SignalType
  confidence: number
  suggested_position_pct: number
  time_horizon_days: number
  thesis: string
  risks: string[]
  invalidators: string[]
  evidence: Record<string, string>
}

export interface SignalResponse {
  id: number
  symbol: string
  signal: SignalType
  status: SignalStatus
}

export interface RiskEvaluationResponse {
  signal_id: number
  status: 'APPROVED' | 'REJECTED'
  reason: string
  applied_rules: Record<string, unknown>
}

export interface OrderSubmitResponse {
  order_id: number
  status: OrderStatus
  symbol: string
  qty: number
  signal_id: number
}

export interface OrderListItem {
  order_id: number
  signal_id: number
  account_id: string
  symbol: string
  side: 'BUY' | 'SELL'
  order_type: string
  qty: number
  status: OrderStatus
  limit_price: number | null
  fill_price: number | null
  fee: number | null
  submitted_at: string | null
  created_at: string
}

export interface PositionView {
  id?: number
  account_id?: string
  symbol: string
  qty: number
  avg_cost: number
  market_price: number
  market_value: number
  updated_at?: string
}

export interface PositionCreateRequest {
  symbol: string
  qty: number
  avg_cost: number
  market_price: number
}

export interface PositionUpdateRequest {
  qty?: number
  avg_cost?: number
  market_price?: number
}

export interface PortfolioResponse {
  account_id: string
  positions: PositionView[]
}

export interface AssetItem {
  id: number
  account_id: string
  asset_code: string
  asset_name: string
  category: string
  quantity: number
  frozen_quantity: number
  unit_price: number
  currency: string
  status: string
  note: string | null
  valuation: number
  created_at: string
  updated_at: string
}

export interface AssetCreateRequest {
  asset_code: string
  asset_name: string
  category: string
  quantity: number
  frozen_quantity: number
  unit_price: number
  currency: string
  status: string
  note?: string
}

export interface AssetUpdateRequest {
  asset_name?: string
  category?: string
  quantity?: number
  frozen_quantity?: number
  unit_price?: number
  currency?: string
  status?: string
  note?: string
}

export interface SnapshotResponse {
  account_id: string
  cash: number
  equity: number
  gross_exposure: number
  net_exposure: number
  drawdown: number
  snapshot_at: string
}

export interface ResearchReportListItem {
  id: string
  title: string
  ticker: string
  report_date: string
  generated_at: string
  source_type: string
  source_label: string
  rating: string
  summary: string
}

export interface ResearchAnalysisSection {
  key: string
  title: string
  document_count: number
  content: string
}

export interface ResearchReportDetail extends ResearchReportListItem {
  content: string
  analysis_sections: ResearchAnalysisSection[]
}

export interface ResearchGenerateRequest {
  ticker: string
  trade_date: string
  output_language: string
  llm_provider: string
  quick_think_llm: string
  deep_think_llm: string
  max_debate_rounds: number
  max_risk_discuss_rounds: number
  checkpoint_enabled: boolean
  selected_analysts: string[]
}

export interface ResearchJob {
  id: string
  user_id: number
  ticker: string
  trade_date: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  report_id: string | null
  error_message: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export type NewsImpact = '高' | '中' | '低'

export interface NewsListItem {
  id: string
  title: string
  summary: string
  source: string
  source_url: string | null
  category: string
  impact: NewsImpact
  symbols: string[]
  published_at: string
  is_read: boolean
  is_bookmarked: boolean
}

export interface NewsDetail extends NewsListItem {
  content: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | null
  source_score: number | null
  tags: string[]
}

export interface ListNewsParams {
  keyword?: string
  category?: string
  impact?: NewsImpact
  symbol?: string
  time_range?: string
  is_bookmarked?: boolean
  is_read?: boolean
  page?: number
  page_size?: number
  sort_by?: 'published_at' | 'impact'
  sort_order?: 'asc' | 'desc'
}

export interface NewsListResponse {
  items: NewsListItem[]
  total: number
  page: number
  page_size: number
}

export interface NewsStateResponse {
  news_id: string
  is_read: boolean
  is_bookmarked: boolean
  read_at: string | null
}

export interface ApiErrorPayload {
  detail?: string
  error?: {
    code?: string
    message?: string
    details?: Record<string, unknown>
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone?: string
  role?: 'risk_manager' | 'finance_operator' | 'auditor'
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  user: AuthUser
}

export interface UserListItem extends AuthUser {}

export interface UserUpdateRequest {
  name?: string
  phone?: string
  role?: 'super_admin' | 'risk_manager' | 'finance_operator' | 'auditor'
  mfa_enabled?: boolean
}

export interface UserCreateRequest {
  name: string
  email: string
  password: string
  phone?: string
  role: 'super_admin' | 'risk_manager' | 'finance_operator' | 'auditor'
  mfa_enabled?: boolean
}

export function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearStoredAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.detail ??
      error.message ??
      'Request failed'
    )
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Unknown error'
}

export async function healthCheck() {
  const { data } = await apiClient.get<{ status: string }>('/health')
  return data
}

export async function login(payload: LoginRequest) {
  const { data } = await apiClient.post<LoginResponse>('/v1/auth/login', payload)
  return data
}

export async function register(payload: RegisterRequest) {
  const { data } = await apiClient.post<LoginResponse>('/v1/auth/register', payload)
  return data
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<AuthUser>('/v1/auth/me')
  return data
}

export async function logout() {
  const { data } = await apiClient.post<{ status: string; user_id: number }>('/v1/auth/logout', {})
  return data
}

export async function listUsers() {
  const { data } = await apiClient.get<UserListItem[]>('/v1/users')
  return data
}

export async function updateUser(userId: number, payload: UserUpdateRequest) {
  const { data } = await apiClient.patch<UserListItem>(`/v1/users/${userId}`, payload)
  return data
}

export async function disableUser(userId: number) {
  const { data } = await apiClient.post<UserListItem>(`/v1/users/${userId}/disable`, {})
  return data
}

export async function createUser(payload: UserCreateRequest) {
  const { data } = await apiClient.post<UserListItem>('/v1/users', payload)
  return data
}

export async function bootstrapDefaultAccount() {
  const { data } = await apiClient.post<AccountSummary>('/v1/accounts/bootstrap', {})
  return data
}

export async function getDefaultAccount() {
  const { data } = await apiClient.get<AccountSummary>('/v1/accounts/default')
  return data
}

export async function ingestSignal(payload: SignalIngestRequest) {
  const { data } = await apiClient.post<SignalResponse>('/v1/signals/ingest', payload)
  return data
}

export async function evaluateRisk(signalId: number) {
  const { data } = await apiClient.post<RiskEvaluationResponse>(`/v1/risk/evaluate/${signalId}`)
  return data
}

export async function submitOrder(signalId: number) {
  const { data } = await apiClient.post<OrderSubmitResponse>(`/v1/orders/submit/${signalId}`)
  return data
}

export async function listOrders() {
  const { data } = await apiClient.get<OrderListItem[]>('/v1/orders')
  return data
}

export async function getPortfolio() {
  const { data } = await apiClient.get<PortfolioResponse>('/v1/portfolio')
  return data
}

export async function listPositions() {
  const { data } = await apiClient.get<PositionView[]>('/v1/positions')
  return data
}

export async function createPosition(payload: PositionCreateRequest) {
  const { data } = await apiClient.post<PositionView>('/v1/positions', payload)
  return data
}

export async function updatePosition(positionId: number, payload: PositionUpdateRequest) {
  const { data } = await apiClient.patch<PositionView>(`/v1/positions/${positionId}`, payload)
  return data
}

export async function deletePosition(positionId: number) {
  const { data } = await apiClient.delete<{ status: string; position_id: number }>(`/v1/positions/${positionId}`)
  return data
}

export async function listResearchReports(params?: { ticker?: string; date?: string }) {
  const { data } = await apiClient.get<ResearchReportListItem[]>('/v1/research/reports', { params })
  return data
}

export async function generateResearchReport(payload: ResearchGenerateRequest) {
  const { data } = await apiClient.post<ResearchJob>('/v1/research/reports/generate', payload)
  return data
}

export async function listResearchJobs() {
  const { data } = await apiClient.get<ResearchJob[]>('/v1/research/reports/jobs')
  return data
}

export async function getResearchJob(jobId: string) {
  const { data } = await apiClient.get<ResearchJob>(`/v1/research/reports/jobs/${encodeURIComponent(jobId)}`)
  return data
}

export async function cancelResearchJob(jobId: string) {
  const { data } = await apiClient.post<ResearchJob>(`/v1/research/reports/jobs/${encodeURIComponent(jobId)}/cancel`)
  return data
}

export async function getResearchReport(reportId: string) {
  const { data } = await apiClient.get<ResearchReportDetail>(`/v1/research/reports/${encodeURIComponent(reportId)}`)
  return data
}

export async function listNews(params?: ListNewsParams) {
  const { data } = await apiClient.get<NewsListResponse>('/v1/news', { params })
  return data
}

export async function getNewsDetail(newsId: string) {
  const { data } = await apiClient.get<NewsDetail>(`/v1/news/${encodeURIComponent(newsId)}`)
  return data
}

export async function markNewsRead(newsId: string) {
  const { data } = await apiClient.post<NewsStateResponse>(`/v1/news/${encodeURIComponent(newsId)}/read`, {})
  return data
}

export async function bookmarkNews(newsId: string) {
  const { data } = await apiClient.post<NewsStateResponse>(`/v1/news/${encodeURIComponent(newsId)}/bookmark`, {})
  return data
}

export async function unbookmarkNews(newsId: string) {
  const { data } = await apiClient.delete<NewsStateResponse>(`/v1/news/${encodeURIComponent(newsId)}/bookmark`)
  return data
}

export async function downloadResearchReport(reportId: string) {
  const { data } = await apiClient.get<string>(`/v1/research/reports/${encodeURIComponent(reportId)}/download`, {
    responseType: 'text',
  })
  return data
}

export async function deleteResearchReport(reportId: string) {
  await apiClient.delete(`/v1/research/reports/${encodeURIComponent(reportId)}`)
}

export async function listAssets() {
  const { data } = await apiClient.get<AssetItem[]>('/v1/assets')
  return data
}

export async function createAsset(payload: AssetCreateRequest) {
  const { data } = await apiClient.post<AssetItem>('/v1/assets', payload)
  return data
}

export async function updateAsset(assetId: number, payload: AssetUpdateRequest) {
  const { data } = await apiClient.patch<AssetItem>(`/v1/assets/${assetId}`, payload)
  return data
}

export async function deleteAsset(assetId: number) {
  const { data } = await apiClient.delete<{ status: string; asset_id: number }>(`/v1/assets/${assetId}`)
  return data
}

export async function createSnapshot() {
  const { data } = await apiClient.post<SnapshotResponse>('/v1/snapshots/create', {})
  return data
}

export async function getLatestSnapshot() {
  const { data } = await apiClient.get<SnapshotResponse>('/v1/snapshots/latest')
  return data
}
