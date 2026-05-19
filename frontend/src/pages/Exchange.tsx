// 设计提醒：买卖交易页是交易后台的执行终端，强调买卖切换、风险提示、盘口深度与下单反馈。
import { useMemo, useState } from 'react'
import { ArrowDownUp, BadgeDollarSign, CircleDollarSign, Landmark, TrendingUp } from 'lucide-react'
import DataTable, { type Column } from '@/components/common/DataTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockTrades, type Trade } from '@/mock/data'

type Side = '买入' | '卖出'
type OrderType = '限价' | '市价'
type Pair = 'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT'

const pairMeta: Record<Pair, { price: number; base: string; availableBase: number; availableQuote: number; change: number }> = {
  'BTC/USDT': { price: 64218.72, base: 'BTC', availableBase: 1.2842, availableQuote: 86540.18, change: 2.38 },
  'ETH/USDT': { price: 3128.56, base: 'ETH', availableBase: 42.85, availableQuote: 86540.18, change: 1.14 },
  'SOL/USDT': { price: 152.77, base: 'SOL', availableBase: 840.5, availableQuote: 86540.18, change: -0.82 },
}

const recentColumns: Column<Trade>[] = [
  { key: 'time', title: '时间', render: (row) => row.time.slice(11) },
  { key: 'pair', title: '交易对', render: (row) => <span className="font-semibold text-slate-950">{row.pair}</span> },
  { key: 'direction', title: '方向', render: (row) => <span className={row.direction === '买' ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>{row.direction}</span> },
  { key: 'price', title: '价格', render: (row) => row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
  { key: 'quantity', title: '数量', render: (row) => row.quantity.toFixed(4) },
]

export default function Exchange() {
  const [pair, setPair] = useState<Pair>('BTC/USDT')
  const [side, setSide] = useState<Side>('买入')
  const [orderType, setOrderType] = useState<OrderType>('限价')
  const [price, setPrice] = useState(pairMeta[pair].price.toFixed(2))
  const [amount, setAmount] = useState('0.10')
  const [percent, setPercent] = useState(25)
  const [message, setMessage] = useState('')

  const meta = pairMeta[pair]
  const numericPrice = orderType === '市价' ? meta.price : Number(price || meta.price)
  const numericAmount = Number(amount || 0)
  const estimated = numericPrice * numericAmount

  const orderBook = useMemo(() => {
    const asks = Array.from({ length: 7 }).map((_, index) => ({ price: meta.price + (7 - index) * (meta.price * 0.0008), amount: 0.18 + index * 0.07, side: '卖盘' }))
    const bids = Array.from({ length: 7 }).map((_, index) => ({ price: meta.price - (index + 1) * (meta.price * 0.0007), amount: 0.22 + index * 0.08, side: '买盘' }))
    return { asks, bids }
  }, [meta.price])

  const filteredTrades = useMemo(() => mockTrades.filter((trade) => trade.pair === pair).slice(0, 8), [pair])

  const changePair = (value: Pair) => {
    setPair(value)
    setPrice(pairMeta[value].price.toFixed(2))
    setMessage('')
  }

  const setQuickPercent = (value: number) => {
    setPercent(value)
    const budget = side === '买入' ? meta.availableQuote * (value / 100) : meta.availableBase * (value / 100)
    const nextAmount = side === '买入' ? budget / numericPrice : budget
    setAmount(nextAmount.toFixed(side === '买入' ? 6 : 4))
  }

  const submitOrder = () => {
    if (!numericAmount || numericAmount <= 0) {
      setMessage('请输入有效的交易数量。')
      return
    }
    if (side === '买入' && estimated > meta.availableQuote) {
      setMessage('USDT 可用余额不足，无法提交买入委托。')
      return
    }
    if (side === '卖出' && numericAmount > meta.availableBase) {
      setMessage(`${meta.base} 可用余额不足，无法提交卖出委托。`)
      return
    }
    setMessage(`${side} ${pair} ${numericAmount.toFixed(4)} ${meta.base} 的${orderType}委托已模拟提交，预估成交额 ${estimated.toFixed(2)} USDT。`)
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className={`absolute -right-16 -top-16 h-52 w-52 rounded-full ${side === '买入' ? 'bg-emerald-400/10' : 'bg-rose-400/10'} blur-3xl`} />
          <div className="relative flex flex-col gap-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">买卖交易</h2>
                <p className="mt-2 text-sm text-slate-500">模拟现货交易表单，支持交易对、方向、订单类型和资金比例联动。</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-right">
                <p className="text-sm text-slate-500">最新价格</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">${meta.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className={`mt-1 text-sm font-semibold ${meta.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{meta.change >= 0 ? '+' : ''}{meta.change}%</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>交易对</span>
                <Select value={pair} onValueChange={(v) => changePair(v as Pair)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(pairMeta) as Pair[]).map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>订单类型</span>
                <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="限价">限价</SelectItem>
                    <SelectItem value="市价">市价</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <div className="space-y-2 text-sm font-medium text-slate-700">
                <span>方向</span>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200">
                  {(['买入', '卖出'] as Side[]).map((item) => <button key={item} className={`rounded-lg px-3 py-2 font-bold transition ${side === item ? (item === '买入' ? 'bg-emerald-400 text-slate-950' : 'bg-rose-500 text-white') : 'text-slate-500 hover:bg-white hover:text-slate-900'}`} onClick={() => { setSide(item); setMessage('') }}>{item}</button>)}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>委托价格</span>
                <input disabled={orderType === '市价'} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50" value={orderType === '市价' ? '按市场最优价成交' : price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>交易数量（{meta.base}）</span>
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-500"><span>资金比例</span><span>{percent}%</span></div>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((item) => <button key={item} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${percent === item ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900'}`} onClick={() => setQuickPercent(item)}>{item}%</button>)}
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-3">
              <Info label="可用 USDT" value={`$${meta.availableQuote.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={CircleDollarSign} />
              <Info label={`可用 ${meta.base}`} value={meta.availableBase.toLocaleString(undefined, { maximumFractionDigits: 6 })} icon={Landmark} />
              <Info label="预估成交额" value={`$${estimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={BadgeDollarSign} />
            </div>

            <button className={`rounded-2xl px-5 py-4 text-base font-black shadow-lg transition hover:-translate-y-0.5 ${side === '买入' ? 'bg-emerald-400 text-slate-950 shadow-emerald-950/30 hover:bg-emerald-300' : 'bg-rose-500 text-white shadow-rose-950/30 hover:bg-rose-400'}`} onClick={submitOrder}>{side} {pair}</button>
            {message && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-700">{message}</div>}
          </div>
        </div>

        <div className="grid gap-5">
          <OrderBook asks={orderBook.asks} bids={orderBook.bids} midPrice={meta.price} />
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">账户摘要</h3>
                <p className="text-sm text-slate-500">展示当前交易对相关余额和风险提示</p>
              </div>
              <ArrowDownUp className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniCard title="可买" value={`${(meta.availableQuote / meta.price).toFixed(6)} ${meta.base}`} />
              <MiniCard title="可卖" value={`${meta.availableBase.toFixed(6)} ${meta.base}`} />
              <MiniCard title="预估费率" value="0.04%" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">最新成交</h3>
          <p className="text-sm text-slate-500">跟随当前交易对过滤最近成交记录</p>
        </div>
        <DataTable columns={recentColumns} data={filteredTrades} showPagination={false} />
      </section>
    </div>
  )
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon: typeof CircleDollarSign }) {
  return <div className="flex items-center gap-3"><div className="rounded-xl bg-white p-2 text-cyan-600 ring-1 ring-slate-200"><Icon className="h-4 w-4" /></div><div><p className="text-slate-500">{label}</p><p className="font-semibold text-slate-950">{value}</p></div></div>
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 font-bold text-slate-950">{value}</p></div>
}

function OrderBook({ asks, bids, midPrice }: { asks: { price: number; amount: number; side: string }[]; bids: { price: number; amount: number; side: string }[]; midPrice: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">盘口深度</h3>
          <p className="text-sm text-slate-500">模拟买卖盘报价</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700"><TrendingUp className="h-4 w-4" /> Live</div>
      </div>
      <div className="space-y-1 text-sm">
        {asks.map((item, index) => <BookRow key={`ask-${index}`} item={item} color="rose" />).reverse()}
        <div className="my-3 flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2 text-white"><span>中间价</span><span className="font-bold">{midPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        {bids.map((item, index) => <BookRow key={`bid-${index}`} item={item} color="emerald" />)}
      </div>
    </div>
  )
}

function BookRow({ item, color }: { item: { price: number; amount: number; side: string }; color: 'rose' | 'emerald' }) {
  const width = Math.min(96, Math.round(item.amount * 24))
  return (
    <div className="relative overflow-hidden rounded-lg px-3 py-2">
      <div className={`absolute inset-y-0 right-0 ${color === 'rose' ? 'bg-rose-50' : 'bg-emerald-50'}`} style={{ width: `${width}%` }} />
      <div className="relative flex items-center justify-between">
        <span className={color === 'rose' ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-600'}>{item.price.toFixed(2)}</span>
        <span className="text-slate-500">{item.amount.toFixed(4)}</span>
      </div>
    </div>
  )
}
