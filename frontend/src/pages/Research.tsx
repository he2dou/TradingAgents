import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bookmark, BookOpenCheck, Bot, Calendar, ChevronDown, Download, Eye, FileText, Plus, Radio, RefreshCw, Search, Settings2, Sparkles, Trash2, TrendingUp } from 'lucide-react'
import { Streamdown } from 'streamdown'
import { toast } from 'sonner'
import StatCard from '@/components/common/StatCard'
import DataTable, { type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import { useResearchNotifications } from '@/contexts/ResearchNotificationsContext'
import { consumePendingResearchJobError, consumePendingResearchReportId } from '@/lib/research-notification'
import {
  deleteResearchReport,
  downloadResearchReport,
  generateResearchReport,
  getApiErrorMessage,
  type ResearchAnalysisSection,
  getResearchReport,
  listResearchReports,
  type ResearchReportDetail,
  type ResearchReportListItem,
} from '@/services/api'

const ratings = ['全部', '看多', '中性', '谨慎', '未知'] as const
const outputLanguages = ['中文', 'English'] as const
const llmProviders = ['deepseek', 'openai', 'google', 'anthropic', 'ollama'] as const
const quickModels = ['deepseek-v4-flash', 'gpt-5.4-mini', 'gemini-2.5-flash', 'claude-sonnet'] as const
const deepModels = ['deepseek-v4-pro', 'gpt-5.4', 'gemini-2.5-pro', 'claude-opus'] as const
const analystOptions = [
  { key: 'market', label: '市场分析师' },
  { key: 'social', label: '社媒分析师' },
  { key: 'news', label: '新闻分析师' },
  { key: 'fundamentals', label: '基本面分析师' },
] as const
const analysisStageOptions = [
  { key: '1_analysts', label: '1_analysts' },
  { key: '2_research', label: '2_research' },
  { key: '3_trading', label: '3_trading' },
  { key: '4_risk', label: '4_risk' },
  { key: '5_portfolio', label: '5_portfolio' },
] as const

export default function Research() {
  const { can } = useAuth()
  const { jobs, hasActiveJobs, refreshJobs, upsertJob } = useResearchNotifications()
  const [keyword, setKeyword] = useState('')
  const [tickerFilter, setTickerFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [rating, setRating] = useState<(typeof ratings)[number]>('全部')
  const [reports, setReports] = useState<ResearchReportListItem[]>([])
  const [selected, setSelected] = useState<ResearchReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [previewOpen, setPreviewOpen] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisSection, setAnalysisSection] = useState<ResearchAnalysisSection | null>(null)
  const [analysisReportTitle, setAnalysisReportTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ResearchReportListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [generateTicker, setGenerateTicker] = useState('')
  const [generateDate, setGenerateDate] = useState(new Date().toISOString().slice(0, 10))
  const [outputLanguage, setOutputLanguage] = useState<(typeof outputLanguages)[number]>('中文')
  const [llmProvider, setLlmProvider] = useState<(typeof llmProviders)[number]>('deepseek')
  const [quickModel, setQuickModel] = useState<(typeof quickModels)[number]>('deepseek-v4-flash')
  const [deepModel, setDeepModel] = useState<(typeof deepModels)[number]>('deepseek-v4-pro')
  const [maxDebateRounds, setMaxDebateRounds] = useState('1')
  const [maxRiskRounds, setMaxRiskRounds] = useState('1')
  const [checkpointEnabled, setCheckpointEnabled] = useState(true)
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>(['market', 'news', 'fundamentals'])

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { ticker?: string; date?: string } = {}
      const t = tickerFilter.trim().toUpperCase()
      if (t) params.ticker = t
      const d = dateFilter.trim()
      if (d) params.date = d
      const items = await listResearchReports(params)
      setReports(items)
      setSelected(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [tickerFilter, dateFilter])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  useEffect(() => {
    const pendingJobError = consumePendingResearchJobError()
    if (pendingJobError) {
      setError(`研报任务失败：${pendingJobError.ticker} · ${pendingJobError.tradeDate} · ${pendingJobError.errorMessage}`)
      setMessage(`已定位到失败任务：${pendingJobError.ticker} · ${pendingJobError.tradeDate}`)
    }

    const pendingReportId = consumePendingResearchReportId()
    if (!pendingReportId) return
    setDetailLoading(true)
    setPreviewOpen(true)
    void getResearchReport(pendingReportId)
      .then((detail) => {
        setSelected(detail)
        setMessage(`正在预览研报：${detail.title}`)
      })
      .catch((err) => {
        const msg = getApiErrorMessage(err)
        setError(msg)
        toast.error(msg)
      })
      .finally(() => {
        setDetailLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return reports.filter((item) => {
      const matchRating = rating === '全部' || item.rating === rating
      const matchKeyword =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.ticker.toLowerCase().includes(q)
      return matchRating && matchKeyword
    })
  }, [keyword, rating, reports])

  const avgCoverage = filtered.length
    ? filtered.reduce((sum, item) => sum + item.summary.length, 0) / filtered.length
    : 0
  const bullishCount = filtered.filter((item) => item.rating === '看多').length
  const cautiousCount = filtered.filter((item) => item.rating === '谨慎').length
  const coveredTickers = new Set(filtered.map((item) => item.ticker)).size
  const selectedAnalystLabels = analystOptions
    .filter((option) => selectedAnalysts.includes(option.key))
    .map((option) => option.label)
  const activeReport = selected ?? filtered[0] ?? null

  const previewReport = async (report: ResearchReportListItem) => {
    setDetailLoading(true)
    setPreviewOpen(true)
    try {
      const detail = await getResearchReport(report.id)
      setSelected(detail)
      setMessage(`正在预览研报：${report.title}`)
    } catch (err) {
      const msg = getApiErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setDetailLoading(false)
    }
  }

  const openAnalysisSection = async (report: ResearchReportListItem, sectionKey: string) => {
    setAnalysisLoading(true)
    setAnalysisOpen(true)
    try {
      const detail = await getResearchReport(report.id)
      const section = detail.analysis_sections.find((item) => item.key === sectionKey)
      if (!section) {
        setAnalysisSection(null)
        setAnalysisReportTitle(report.title)
        toast.error(`${report.title} 暂无 ${sectionKey} 过程研报`)
        return
      }
      setAnalysisSection(section)
      setAnalysisReportTitle(report.title)
      setMessage(`正在查看 ${report.title} · ${section.title}`)
    } catch (err) {
      const msg = getApiErrorMessage(err)
      setError(msg)
      setAnalysisSection(null)
      toast.error(msg)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleDownload = async (report: ResearchReportListItem | ResearchReportDetail) => {
    if (!can('research.download')) {
      setMessage('当前角色无下载研报权限。')
      return
    }
    try {
      const content = await downloadResearchReport(report.id)
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.ticker}_${report.report_date}.md`
      link.click()
      URL.revokeObjectURL(url)
      setMessage(`${report.title} 已生成 Markdown 下载。`)
    } catch (err) {
      const msg = getApiErrorMessage(err)
      setError(msg)
      toast.error(msg)
    }
  }

  const toggleBookmark = (report: ResearchReportListItem | ResearchReportDetail) => {
    if (!can('research.bookmark')) {
      setMessage('当前角色无收藏研报权限。')
      return
    }
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(report.id)) next.delete(report.id)
      else next.add(report.id)
      return next
    })
    setMessage(`${report.title} 已更新收藏状态。`)
  }

  const toggleAnalyst = (key: string) => {
    setSelectedAnalysts((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== key)
      }
      return [...prev, key]
    })
  }

  const generateReport = async () => {
    const normalizedTicker = generateTicker.trim().toUpperCase()
    if (!normalizedTicker) {
      toast.error('请先填写研报标的代码')
      return
    }
    if (!can('research.generate')) {
      toast.error('当前角色无生成研报权限')
      return
    }
    setGenerating(true)
    setError(null)
    setMessage(`正在生成 ${normalizedTicker} 的研报，请稍候...`)
    try {
      const job = await generateResearchReport({
        ticker: normalizedTicker,
        trade_date: generateDate,
        output_language: outputLanguage === '中文' ? 'Chinese' : outputLanguage,
        llm_provider: llmProvider,
        quick_think_llm: quickModel,
        deep_think_llm: deepModel,
        max_debate_rounds: Number(maxDebateRounds || '1'),
        max_risk_discuss_rounds: Number(maxRiskRounds || '1'),
        checkpoint_enabled: checkpointEnabled,
        selected_analysts: selectedAnalysts,
      })
      upsertJob(job)
      setTickerFilter(normalizedTicker)
      setDateFilter(generateDate)
      setMessage(
        `已创建研报任务：${normalizedTicker} · ${generateDate} · ${llmProvider}/${deepModel}，分析师 ${selectedAnalystLabels.join('、') || '未选择'}。任务完成后会自动通知。`,
      )
      toast.success('研报生成任务已提交')
      setGenerateDialogOpen(false)
    } catch (err) {
      const msg = getApiErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  const refreshReportList = async () => {
    setRefreshing(true)
    try {
      await loadReports()
    } finally {
      setRefreshing(false)
    }
  }

  const confirmDelete = (report: ResearchReportListItem) => {
    setDeleteTarget(report)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteResearchReport(deleteTarget.id)
      toast.success(`${deleteTarget.title} 已删除`)
      if (selected?.id === deleteTarget.id) {
        setSelected(null)
        setPreviewOpen(false)
      }
      setDeleteTarget(null)
      await loadReports()
    } catch (err) {
      const msg = getApiErrorMessage(err)
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<ResearchReportListItem>[] = [
    {
      key: 'title',
      title: '研报标题',
      render: (row) => (
        <div className="max-w-md">
          <p className="font-semibold text-slate-950">{row.title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{row.summary}</p>
        </div>
      ),
    },
    {
      key: 'ticker',
      title: '标的',
      render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{row.ticker}</span>,
    },
    {
      key: 'rating',
      title: '观点',
      render: (row) => <RatingBadge rating={row.rating} />,
    },
    {
      key: 'generated_at',
      title: '生成时间',
    },
    {
      key: 'source_label',
      title: '来源',
      render: (row) => <span className="text-sm text-slate-600">{row.source_label}</span>,
    },
    {
      key: 'action',
      title: '操作',
      render: (row) => (
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-slate-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={() => void previewReport(row)}
          >
            <Eye className="mr-1 inline h-4 w-4" />
            预览
          </button>
          <button
            disabled={!can('research.download')}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => void handleDownload(row)}
          >
            <Download className="mr-1 inline h-4 w-4" />
            下载
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                分析
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 rounded-xl border-slate-200 bg-white">
              {analysisStageOptions.map((item) => (
                <DropdownMenuItem key={item.key} onClick={() => void openAnalysisSection(row, item.key)} className="cursor-pointer rounded-lg">
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            disabled={!can('research.bookmark')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              bookmarkedIds.has(row.id) ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
            onClick={() => toggleBookmark(row)}
          >
            <Bookmark className="mr-1 inline h-4 w-4" />
            {bookmarkedIds.has(row.id) ? '已藏' : '收藏'}
          </button>
          <button
            disabled={!can('research.delete')}
            className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => confirmDelete(row)}
          >
            <Trash2 className="mr-1 inline h-4 w-4" />
            删除
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="研报总数" value={loading ? '--' : String(filtered.length)} icon={FileText} change="当前可读报告" tone="cyan" />
        <StatCard title="覆盖标的" value={loading ? '--' : String(coveredTickers)} icon={TrendingUp} change="来自 TradingAgents 输出" tone="emerald" />
        <StatCard title="看多观点" value={loading ? '--' : String(bullishCount)} icon={BookOpenCheck} change="按报告评级统计" tone="amber" />
        <StatCard title="谨慎提示" value={loading ? '--' : String(cautiousCount)} icon={Sparkles} change={`平均摘要长度 ${avgCoverage.toFixed(0)}`} tone="rose" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Research Search</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">研报中心</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">检索真实 TradingAgents 报告，按标的、观点和日期快速定位；研报生成参数收进中间弹窗，避免打断主阅读流。</p>
            {hasActiveJobs && (
              <p className="mt-2 text-xs text-cyan-300">
                当前有 {jobs.filter((job) => job.status === 'queued' || job.status === 'running').length} 个研报任务正在后台执行。
              </p>
            )}
            <div className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-medium text-slate-300">
                <span>关键词搜索</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索标题、摘要或标的代码"
                  />
                </div>
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-2 text-sm font-medium text-slate-300">
                  <span>标的代码</span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                      value={tickerFilter}
                      onChange={(e) => setTickerFilter(e.target.value)}
                      placeholder="如 NVDA"
                    />
                  </div>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-300">
                  <span>报告日期</span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <input
                      type="date"
                      className="w-full bg-transparent text-white outline-none"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-300">
                  <span>观点</span>
                  <ShadcnSelect value={rating} onValueChange={(v) => setRating(v as (typeof ratings)[number])}>
                    <SelectTrigger className="w-full rounded-xl border-slate-700 bg-slate-900 text-white focus:ring-cyan-400/20 [&>svg]:text-slate-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ratings.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </ShadcnSelect>
                </label>
              </div>
            </div>
            {message && <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{message}</div>}
            {error && <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-cyan-700">当前详情</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{activeReport?.title ?? '暂无研报详情'}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {activeReport?.summary ?? '从下方研报列表点击“预览”，或先使用左侧筛选快速锁定目标报告。'}
              </p>
            </div>
            <ImpactLikeBadge active={activeReport != null} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard label="标的" value={activeReport?.ticker ?? '未选择'} />
            <InfoCard label="观点" value={activeReport?.rating ?? '未知'} />
            <InfoCard label="生成时间" value={activeReport ? activeReport.generated_at.slice(5) : '--'} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {activeReport ? (
              <>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{activeReport.ticker}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{activeReport.source_label}</span>
              </>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">暂无可预览标的</span>
            )}
          </div>
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <Radio className="mr-2 inline h-4 w-4 text-cyan-600" />
            提示：点击下方列表中的“预览”会展开完整研报；生成新研报请使用下方按钮打开中间弹窗配置参数。
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              最近任务：{jobs.length > 0 ? `${jobs[0].ticker} · ${jobs[0].status}` : '暂无'}
            </div>
            <Button
              onClick={() => setGenerateDialogOpen(true)}
              disabled={!can('research.generate')}
              className="rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Plus className="h-4 w-4" />
              新增研报
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">研报列表</h3>
            <p className="text-sm text-slate-500">从 TradingAgents 报告目录和运行日志中自动聚合，点击预览后从右侧展开完整报告。</p>
          </div>
          <Button
            variant="outline"
            onClick={() => void refreshReportList()}
            disabled={refreshing}
            className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
        <DataTable columns={columns} data={filtered} showPagination={false} />
      </section>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-full border-l border-slate-200 bg-slate-50 p-0 sm:max-w-6xl">
          <SheetHeader className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="pr-10">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {selected && <RatingBadge rating={selected.rating} />}
                {selected && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{selected.source_label}</span>}
              </div>
              <SheetTitle className="text-2xl font-bold tracking-tight text-slate-950">{selected?.title ?? '暂无研报'}</SheetTitle>
              <SheetDescription className="mt-2 text-sm leading-6 text-slate-500">
                {selected ? `${selected.ticker} · ${selected.report_date} · ${selected.generated_at}` : '当前没有可展示的 TradingAgents 报告。'}
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {detailLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">正在加载研报内容...</div>
            ) : selected ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <PreviewInfo label="标的" value={selected.ticker} />
                  <PreviewInfo label="报告日期" value={selected.report_date} />
                  <PreviewInfo label="评级" value={selected.rating} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm leading-7 text-slate-600">{selected.summary}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="streamdown-body text-sm leading-7 text-slate-700">
                    <Streamdown>{selected.content}</Streamdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">当前没有可展示的 TradingAgents 报告。</div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex flex-wrap items-center justify-end gap-3">
              {selected && (
                <Button
                  variant="outline"
                  onClick={() => void handleDownload(selected)}
                  disabled={!can('research.download')}
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  下载报告
                </Button>
              )}
              {selected && (
                <Button
                  variant="outline"
                  onClick={() => toggleBookmark(selected)}
                  disabled={!can('research.bookmark')}
                  className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  <Bookmark className="h-4 w-4" />
                  {bookmarkedIds.has(selected.id) ? '取消收藏' : '收藏报告'}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <SheetContent side="right" className="w-full border-l border-slate-200 bg-slate-50 p-0 sm:max-w-5xl">
          <SheetHeader className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="pr-10">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {analysisSection && <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{analysisSection.title}</span>}
                {analysisSection && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {analysisSection.document_count} 份过程文档
                  </span>
                )}
              </div>
              <SheetTitle className="text-2xl font-bold tracking-tight text-slate-950">{analysisReportTitle || '过程研报分析'}</SheetTitle>
              <SheetDescription className="mt-2 text-sm leading-6 text-slate-500">
                {analysisSection
                  ? `当前展示 ${analysisSection.title} 阶段的过程研报，内容来自 TradingAgents 分阶段输出。`
                  : '选择某个分析阶段后，这里会展示对应的过程研报内容。'}
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {analysisLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">正在加载过程研报...</div>
            ) : analysisSection ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm leading-7 text-slate-600">
                    这里展示的是 {analysisSection.title} 阶段的完整过程研报，便于查看分析师、研究、交易、风险和组合管理在不同阶段的具体输出。
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="streamdown-body text-sm leading-7 text-slate-700">
                    <Streamdown>{analysisSection.content}</Streamdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">当前报告没有找到对应阶段的过程研报。</div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] sm:max-w-[60rem] overflow-y-auto rounded-[28px] border-slate-200 bg-white p-0 shadow-2xl">
          <DialogHeader className="border-b border-slate-100 px-8 py-6">
            <p className="text-sm font-semibold text-cyan-700">研报生成区</p>
            <DialogTitle className="mt-2 text-3xl font-bold tracking-tight text-slate-950">生成参数与配置</DialogTitle>
            <DialogDescription className="mt-3 text-sm leading-6 text-slate-500">
              在这里配置 TradingAgents 生成研报所需参数。提交后会异步创建任务，完成后通过顶部铃铛通知并自动出现在研报列表中。
            </DialogDescription>
          </DialogHeader>

          <div className="px-8 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <LightInput label="研报标的" value={generateTicker} onChange={setGenerateTicker} placeholder="如 09988.HK / NVDA / SPY" icon={Search} />
              <LightDateInput label="分析日期" value={generateDate} onChange={setGenerateDate} />
              <LightSelectWrapper label="输出语言" value={outputLanguage} options={outputLanguages} onChange={(value) => setOutputLanguage(value as (typeof outputLanguages)[number])} />
              <LightSelectWrapper label="LLM Provider" value={llmProvider} options={llmProviders} onChange={(value) => setLlmProvider(value as (typeof llmProviders)[number])} />
              <LightSelectWrapper label="Quick Think Model" value={quickModel} options={quickModels} onChange={(value) => setQuickModel(value as (typeof quickModels)[number])} />
              <LightSelectWrapper label="Deep Think Model" value={deepModel} options={deepModels} onChange={(value) => setDeepModel(value as (typeof deepModels)[number])} />
              <LightInput label="投资辩论轮数" value={maxDebateRounds} onChange={setMaxDebateRounds} placeholder="1" icon={Settings2} />
              <LightInput label="风控讨论轮数" value={maxRiskRounds} onChange={setMaxRiskRounds} placeholder="1" icon={Settings2} />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">分析师配置</p>
                  <p className="mt-1 text-sm text-slate-500">至少保留 1 个分析师，建议常用组合为 市场 + 新闻 + 基本面。</p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  已选 {selectedAnalysts.length} 个
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {analystOptions.map((option) => {
                  const active = selectedAnalysts.includes(option.key)
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => toggleAnalyst(option.key)}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        active
                          ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'}`}>
                        {active ? '已选' : '未选'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">当前配置摘要</p>
              <p className="mt-2 leading-6">
                {generateTicker ? generateTicker.toUpperCase() : '未填写标的'} · {generateDate} · {outputLanguage} · {llmProvider}/{deepModel} ·
                投资辩论 {maxDebateRounds} 轮 / 风控讨论 {maxRiskRounds} 轮
              </p>
              <p className="mt-2 leading-6">
                分析师：{selectedAnalystLabels.length > 0 ? selectedAnalystLabels.join('、') : '未选择'} ·
                Checkpoint {checkpointEnabled ? '开启' : '关闭'}
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 px-8 py-5">
            <button
              type="button"
              onClick={() => setCheckpointEnabled((value) => !value)}
              className={`mr-auto flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                checkpointEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Checkpoint Resume
              </span>
              <span className="ml-3 rounded-full bg-white/80 px-2 py-0.5 text-xs">
                {checkpointEnabled ? '已开启' : '已关闭'}
              </span>
            </button>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)} className="rounded-2xl border-slate-200">
              关闭
            </Button>
            <Button
              onClick={() => void generateReport()}
              disabled={generating || !can('research.generate')}
              className="rounded-2xl bg-slate-950 px-6 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {generating ? '生成中...' : '开始生成研报'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="rounded-[28px] border-slate-200 bg-white p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="px-8 pb-2 pt-6">
            <DialogTitle className="text-xl font-bold text-slate-950">确认删除研报</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-slate-500">
              确定要删除「{deleteTarget?.title}」吗？此操作将移除报告文件且无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 px-8 pb-6 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-2xl border-slate-200">
              取消
            </Button>
            <Button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-2xl bg-rose-600 px-5 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LightSelectWrapper({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <ShadcnSelect value={value} onValueChange={onChange}>
        <SelectTrigger className="h-[50px] w-full rounded-2xl border-slate-200 bg-slate-50 text-sm focus:ring-slate-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
    </label>
  )
}

function ImpactLikeBadge({ active }: { active: boolean }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ${
      active ? 'bg-cyan-50 text-cyan-700 ring-cyan-100' : 'bg-slate-100 text-slate-500 ring-slate-200'
    }`}>
      {active ? '已定位' : '待选择'}
    </span>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p></div>
}

function LightInput({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: typeof Search
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="flex h-[50px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
        <Icon className="h-4 w-4 text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </label>
  )
}

function LightDateInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="flex h-[50px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
        <Calendar className="h-4 w-4 text-slate-400" />
        <input
          type="date"
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  )
}

function RatingBadge({ rating }: { rating: string }) {
  const style = rating === '看多' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : rating === '中性' ? 'bg-slate-100 text-slate-700 ring-slate-200' : rating === '谨慎' ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-slate-100 text-slate-500 ring-slate-200'
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ${style}`}>{rating}</span>
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p></div>
}
