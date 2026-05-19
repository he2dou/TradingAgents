// 设计提醒：成交记录页用于追溯执行质量，保持列表洁净并突出交易对筛选。
import { useMemo, useState } from 'react'
import { History } from 'lucide-react'
import DataTable, { type Column } from '@/components/common/DataTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockTrades, type Trade } from '@/mock/data'

const pairs = ['全部', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT'] as const
const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Trades() {
  const [pair, setPair] = useState<(typeof pairs)[number]>('全部')
  const filtered = useMemo(() => mockTrades.filter((trade) => pair === '全部' || trade.pair === pair), [pair])
  const columns: Column<Trade>[] = [
    { key: 'time', title: '时间' },
    { key: 'pair', title: '交易对', render: (row) => <span className="font-semibold text-slate-950">{row.pair}</span> },
    { key: 'direction', title: '方向', render: (row) => <span className={row.direction === '买' ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>{row.direction}</span> },
    { key: 'price', title: '价格', render: (row) => money(row.price) },
    { key: 'quantity', title: '数量', render: (row) => row.quantity.toFixed(2) },
    { key: 'fee', title: '手续费', render: (row) => `${row.fee.toFixed(2)} USDT` },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><History className="h-6 w-6" /></div>
          <div>
            <h3 className="text-lg font-semibold text-slate-950">历史成交记录</h3>
            <p className="text-sm text-slate-500">按交易对筛选，分页查看执行明细</p>
          </div>
        </div>
        <label className="space-y-2 text-sm font-medium text-slate-600 md:w-56">
          <span>交易对筛选</span>
          <Select value={pair} onValueChange={(v) => setPair(v as (typeof pairs)[number])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pairs.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <DataTable columns={columns} data={filtered} pageSize={10} />
    </div>
  )
}
