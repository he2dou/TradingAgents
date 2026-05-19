import { useCallback, useEffect, useState } from 'react'
import {
  BookOpenText,
  Clock,
  Loader2,
  Newspaper,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import {
  getApiErrorMessage,
  getSetting,
  listSettings,
  resetSetting,
  updateSetting,
  type SettingsCategoryDetail,
  type SettingsCategoryItem,
} from '@/services/api'

const categoryIcons: Record<string, typeof Settings> = {
  research_center: BookOpenText,
  news: Newspaper,
  system: Server,
}

const llmProviders = ['deepseek', 'openai', 'google', 'anthropic', 'ollama'] as const
const quickModels = ['deepseek-v4-flash', 'gpt-5.4-mini', 'gemini-2.5-flash', 'claude-sonnet'] as const
const deepModels = ['deepseek-v4-pro', 'gpt-5.4', 'gemini-2.5-pro', 'claude-opus'] as const
const outputLanguages = ['Chinese', 'English'] as const
const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR'] as const
const analystOptions = [
  { key: 'market', label: '市场分析师' },
  { key: 'social', label: '社媒分析师' },
  { key: 'news', label: '新闻分析师' },
  { key: 'fundamentals', label: '基本面分析师' },
] as const

type DraftConfig = Record<string, unknown>

export default function SystemSettingsPage() {
  const { can } = useAuth()
  const [categories, setCategories] = useState<SettingsCategoryItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [detail, setDetail] = useState<SettingsCategoryDetail | null>(null)
  const [draft, setDraft] = useState<DraftConfig>({})
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listSettings()
      setCategories(data)
      if (data.length > 0 && !activeCategory) {
        setActiveCategory(data[0].category)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [activeCategory])

  const loadDetail = useCallback(async (category: string) => {
    setDetailLoading(true)
    try {
      const data = await getSetting(category)
      setDetail(data)
      setDraft(data.config)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (activeCategory) {
      loadDetail(activeCategory)
    }
  }, [activeCategory, loadDetail])

  const hasChanges = detail ? JSON.stringify(draft) !== JSON.stringify(detail.config) : false

  const handleSave = async () => {
    if (!activeCategory) return
    setSaving(true)
    try {
      const data = await updateSetting(activeCategory, draft)
      setDetail(data)
      setDraft(data.config)
      toast.success('配置已保存')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!activeCategory) return
    setResetting(true)
    try {
      const data = await resetSetting(activeCategory)
      setDetail(data)
      setDraft(data.config)
      toast.success('已重置为默认配置')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setResetting(false)
      setResetOpen(false)
    }
  }

  const updateDraft = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const canEdit = can('settings.edit')

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" onClick={loadCategories}>
          <RefreshCw className="mr-2 h-4 w-4" />
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">系统设置</h1>
            <p className="text-sm text-muted-foreground">管理研报中心、新闻资讯、系统等全局配置</p>
          </div>
        </div>
        {canEdit && detail && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setResetOpen(true)} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              恢复默认
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              保存配置
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="h-auto flex-wrap gap-1 bg-slate-100 p-1 dark:bg-slate-800/50">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.category] ?? Settings
            return (
              <TabsTrigger
                key={cat.category}
                value={cat.category}
                className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.category} value={cat.category}>
            {detailLoading && activeCategory === cat.category ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
              </div>
            ) : detail && activeCategory === cat.category ? (
              <div className="space-y-6">
                <Card className="border-slate-200/60 dark:border-slate-700/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-cyan-500" />
                      <div>
                        <CardTitle className="text-base">{detail.label}</CardTitle>
                        <CardDescription className="mt-1">{detail.description}</CardDescription>
                      </div>
                    </div>
                    {detail.updated_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        上次更新: {new Date(detail.updated_at).toLocaleString('zh-CN')}
                      </div>
                    )}
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6">
                    {cat.category === 'research_center' && (
                      <ResearchCenterForm draft={draft} onChange={updateDraft} disabled={!canEdit} />
                    )}
                    {cat.category === 'news' && (
                      <NewsConfigForm draft={draft} onChange={updateDraft} disabled={!canEdit} />
                    )}
                    {cat.category === 'system' && (
                      <SystemConfigForm draft={draft} onChange={updateDraft} disabled={!canEdit} />
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认恢复默认</DialogTitle>
            <DialogDescription>
              此操作将「{detail?.label ?? ''}」的所有配置项恢复为系统默认值，已保存的自定义配置将被覆盖。是否继续？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={resetting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认恢复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface FormProps {
  draft: DraftConfig
  onChange: (key: string, value: unknown) => void
  disabled: boolean
}

function FormField({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_2fr] md:items-center">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function ResearchCenterForm({ draft, onChange, disabled }: FormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">模型配置</h3>
          <FormField label="LLM 提供商" description="选择用于研报生成的 LLM 提供商">
            <Select value={String(draft.llm_provider ?? '')} onValueChange={(v) => onChange('llm_provider', v)} disabled={disabled}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {llmProviders.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="快速思考模型" description="用于快速推理的模型">
            <Select value={String(draft.quick_think_llm ?? '')} onValueChange={(v) => onChange('quick_think_llm', v)} disabled={disabled}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quickModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="深度思考模型" description="用于深度分析的模型">
            <Select value={String(draft.deep_think_llm ?? '')} onValueChange={(v) => onChange('deep_think_llm', v)} disabled={disabled}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {deepModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="输出语言" description="研报的输出语言">
            <Select value={String(draft.output_language ?? '')} onValueChange={(v) => onChange('output_language', v)} disabled={disabled}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {outputLanguages.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l === 'Chinese' ? '中文' : 'English'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">流程配置</h3>
          <FormField label="最大辩论轮数" description="多空辩论的最大轮数 (1-5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={Number(draft.max_debate_rounds ?? 1)}
              onChange={(e) => onChange('max_debate_rounds', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
          <FormField label="最大风险讨论轮数" description="风险管理讨论的最大轮数 (1-5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={Number(draft.max_risk_discuss_rounds ?? 1)}
              onChange={(e) => onChange('max_risk_discuss_rounds', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
          <FormField label="生成超时(秒)" description="研报生成的最长等待时间">
            <Input
              type="number"
              min={60}
              value={Number(draft.generation_timeout_seconds ?? 1800)}
              onChange={(e) => onChange('generation_timeout_seconds', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
          <FormField label="启用检查点恢复" description="崩溃后可从上次成功步骤恢复">
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(draft.checkpoint_enabled)}
                onCheckedChange={(v) => onChange('checkpoint_enabled', v)}
                disabled={disabled}
              />
              <span className="text-sm text-muted-foreground">{draft.checkpoint_enabled ? '已启用' : '已禁用'}</span>
            </div>
          </FormField>
          <div>
            <Label className="text-sm font-medium">默认分析师</Label>
            <p className="mt-0.5 mb-2 text-xs text-muted-foreground">选择研报生成时默认启用的分析师</p>
            <div className="flex flex-wrap gap-2">
              {analystOptions.map((opt) => {
                const selected = Array.isArray(draft.default_analysts) && draft.default_analysts.includes(opt.key)
                return (
                  <Button
                    key={opt.key}
                    variant={selected ? 'default' : 'outline'}
                    size="sm"
                    className={selected ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
                    onClick={() => {
                      const current = (draft.default_analysts as string[]) ?? []
                      const next = selected ? current.filter((k) => k !== opt.key) : [...current, opt.key]
                      onChange('default_analysts', next.length > 0 ? next : ['market'])
                    }}
                    disabled={disabled}
                  >
                    {opt.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewsConfigForm({ draft, onChange, disabled }: FormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">抓取配置</h3>
          <FormField label="启用自动抓取" description="自动从数据源抓取新闻">
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(draft.auto_fetch_enabled)}
                onCheckedChange={(v) => onChange('auto_fetch_enabled', v)}
                disabled={disabled}
              />
              <span className="text-sm text-muted-foreground">{draft.auto_fetch_enabled ? '已启用' : '已禁用'}</span>
            </div>
          </FormField>
          <FormField label="抓取间隔(分钟)" description="每次抓取的最小间隔">
            <Input
              type="number"
              min={5}
              value={Number(draft.fetch_interval_minutes ?? 30)}
              onChange={(e) => onChange('fetch_interval_minutes', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
          <FormField label="每次最大抓取数" description="单次抓取的最大新闻条数">
            <Input
              type="number"
              min={1}
              max={200}
              value={Number(draft.max_news_per_fetch ?? 50)}
              onChange={(e) => onChange('max_news_per_fetch', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
          <FormField label="新闻保留天数" description="超过保留期的新闻将被自动清理">
            <Input
              type="number"
              min={1}
              value={Number(draft.retention_days ?? 90)}
              onChange={(e) => onChange('retention_days', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">分析配置</h3>
          <FormField label="启用情感分析" description="对新闻内容进行情感倾向分析">
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(draft.sentiment_analysis_enabled)}
                onCheckedChange={(v) => onChange('sentiment_analysis_enabled', v)}
                disabled={disabled}
              />
              <span className="text-sm text-muted-foreground">{draft.sentiment_analysis_enabled ? '已启用' : '已禁用'}</span>
            </div>
          </FormField>
          <FormField label="默认分类" description="新闻列表的默认分类筛选">
            <Input
              value={String(draft.default_category ?? 'all')}
              onChange={(e) => onChange('default_category', e.target.value)}
              disabled={disabled}
            />
          </FormField>
          <FormField label="影响级别过滤" description="按影响级别筛选新闻">
            <Select value={String(draft.impact_filter ?? 'all')} onValueChange={(v) => onChange('impact_filter', v)} disabled={disabled}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>
    </div>
  )
}

function SystemConfigForm({ draft, onChange, disabled }: FormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">基本配置</h3>
          <FormField label="应用名称" description="显示在界面上的应用名称">
            <Input
              value={String(draft.app_name ?? '')}
              onChange={(e) => onChange('app_name', e.target.value)}
              disabled={disabled}
            />
          </FormField>
          <FormField label="日志级别" description="系统日志的输出级别">
            <Select value={String(draft.log_level ?? 'INFO')} onValueChange={(v) => onChange('log_level', v)} disabled={disabled}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {logLevels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="会话超时(分钟)" description="用户无操作后自动登出的时间">
            <Input
              type="number"
              min={5}
              value={Number(draft.session_timeout_minutes ?? 60)}
              onChange={(e) => onChange('session_timeout_minutes', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">风控配置</h3>
          <FormField label="单仓位最大占比" description="单个持仓占总资产的最大比例">
            <Input
              type="number"
              min={0.01}
              max={1}
              step={0.01}
              value={Number(draft.max_single_position_pct ?? 0.05)}
              onChange={(e) => onChange('max_single_position_pct', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
          <FormField label="总敞口最大占比" description="所有持仓占总资产的最大比例">
            <Input
              type="number"
              min={0.01}
              max={1}
              step={0.01}
              value={Number(draft.max_total_exposure_pct ?? 0.3)}
              onChange={(e) => onChange('max_total_exposure_pct', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
          <FormField label="每日最大新建仓数" description="单个交易日内允许新建的最大仓位数">
            <Input
              type="number"
              min={1}
              value={Number(draft.max_daily_new_positions ?? 5)}
              onChange={(e) => onChange('max_daily_new_positions', Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
          <FormField label="紧急止损开关" description="开启后将立即停止所有新交易">
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(draft.kill_switch_enabled)}
                onCheckedChange={(v) => onChange('kill_switch_enabled', v)}
                disabled={disabled}
              />
              <span className={`text-sm font-medium ${draft.kill_switch_enabled ? 'text-red-500' : 'text-muted-foreground'}`}>
                {draft.kill_switch_enabled ? '已启用 (危险)' : '已禁用'}
              </span>
            </div>
          </FormField>
          <FormField label="维护模式" description="开启后普通用户无法访问系统">
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(draft.maintenance_mode)}
                onCheckedChange={(v) => onChange('maintenance_mode', v)}
                disabled={disabled}
              />
              <span className={`text-sm font-medium ${draft.maintenance_mode ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {draft.maintenance_mode ? '维护中' : '正常'}
              </span>
            </div>
          </FormField>
        </div>
      </div>
    </div>
  )
}
