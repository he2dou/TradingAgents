// 设计提醒：订单页强调筛选效率和操作反馈，按钮与状态色必须一眼可辨。
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Filter } from 'lucide-react'
import DataTable, { type Column } from '@/components/common/DataTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getApiErrorMessage,
  listOrders,
  type OrderListItem,
  type OrderStatus,
} from '@/services/api'

const statuses = ['全部', 'FILLED', 'SUBMITTED', 'PENDING', 'CANCELLED', 'REJECTED'] as const
const money = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Orders() {
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [symbol, setSymbol] = useState('全部')
  const [status, setStatus] = useState<(typeof statuses)[number]>('全部')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOrders() {
      setLoading(true)
      setError(null)

      try {
        const data = await listOrders()
        if (cancelled) return
        setOrders(data)
      } catch (err) {
        if (cancelled) return
        setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      cancelled = true
    }
  }, [])

  const symbols = useMemo(() => {
    const unique = Array.from(new Set(orders.map((order) => order.symbol))).sort()
    return ['全部', ...unique]
  }, [orders])

  const filtered = useMemo(
    () =>
      orders.filter(
        (order) =>
          (symbol === '全部' || order.symbol === symbol) &&
          (status === '全部' || order.status === status),
      ),
    [orders, symbol, status],
  )

  const columns: Column<OrderListItem>[] = [
    {
      key: 'order_id',
      title: '订单ID',
      render: (row) => <span className="font-mono text-xs text-slate-600">#{row.order_id}</span>,
    },
    {
      key: 'symbol',
      title: '标的',
      render: (row) => <span className="font-semibold text-slate-950">{row.symbol}</span>,
    },
    {
      key: 'side',
      title: '方向',
      render: (row) => (
        <span className={row.side === 'BUY' ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
          {row.side === 'BUY' ? '买入' : '卖出'}
        </span>
      ),
    },
    {
      key: 'fill_price',
      title: '成交价格',
      render: (row) => (row.fill_price == null ? '未成交' : `$${money(row.fill_price)}`),
    },
    {
      key: 'qty',
      title: '数量',
      render: (row) => row.qty.toFixed(4),
    },
    {
      key: 'status',
      title: '状态',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'submitted_at',
      title: '提交时间',
      render: (row) => formatDateTime(row.submitted_at ?? row.created_at),
    },
    {
      key: 'action',
      title: '详情',
      render: (row) => (
        <div className="text-xs leading-5 text-slate-500">
          <div>Signal #{row.signal_id}</div>
          <div>Fee {row.fee == null ? '$0.00' : `$${money(row.fee)}`}</div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-950">
          <Filter className="h-5 w-5 text-cyan-600" />
          <h3 className="text-lg font-semibold">订单筛选</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <label className="space-y-2 text-sm font-medium text-slate-600">
            <span>状态筛选</span>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus | '全部')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-600">
            <span>标的筛选</span>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {symbols.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      {error && (
        <section className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>订单数据加载失败：{error}</div>
        </section>
      )}

      <DataTable columns={columns} data={filtered} pageSize={10} />

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
          当前筛选条件下还没有订单记录。
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const style =
    status === 'FILLED'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : status === 'SUBMITTED' || status === 'PENDING'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style}`}>{status}</span>
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}
