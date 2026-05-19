// 设计提醒：侧边栏是深色指挥舱的骨架，菜单按业务域分组，折叠时保留图标导航和权限过滤。
import { BookOpenText, BriefcaseBusiness, ChevronsLeft, ChevronsRight, History, LayoutDashboard, Newspaper, Repeat2, Settings, ShieldCheck, ShoppingCart, Wallet, X } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import type { PermissionKey } from '@/mock/permission'

const menuGroups: { title: string; items: { path: string; label: string; icon: typeof LayoutDashboard; permission: PermissionKey }[] }[] = [
  {
    title: '交易工作台',
    items: [
      { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard, permission: 'menu.dashboard' },
      { path: '/exchange', label: '买卖交易', icon: Repeat2, permission: 'menu.exchange' },
      { path: '/positions', label: '持仓管理', icon: BriefcaseBusiness, permission: 'menu.positions' },
      { path: '/orders', label: '订单管理', icon: ShoppingCart, permission: 'menu.orders' },
    ],
  },
  {
    title: '资金与记录',
    items: [
      { path: '/assets', label: '资产管理', icon: Wallet, permission: 'menu.assets' },
      { path: '/trades', label: '成交记录', icon: History, permission: 'menu.trades' },
    ],
  },
  {
    title: '信息中心',
    items: [
      { path: '/research', label: '研报中心', icon: BookOpenText, permission: 'menu.research' },
      { path: '/news', label: '新闻资讯', icon: Newspaper, permission: 'menu.news' },
    ],
  },
  {
    title: '系统管理',
    items: [
      { path: '/users', label: '用户/权限管理', icon: ShieldCheck, permission: 'menu.users' },
      { path: '/settings', label: '系统设置', icon: Settings, permission: 'menu.settings' },
    ],
  },
]

type SidebarProps = {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export default function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation()
  const { can } = useAuth()
  const allowedGroups = menuGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => can(item.permission)) }))
    .filter((group) => group.items.length > 0)
  const ToggleIcon = collapsed ? ChevronsRight : ChevronsLeft

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 border-r border-slate-800 bg-slate-950 text-slate-100 transition-[width,transform] duration-300 lg:translate-x-0 ${collapsed ? 'lg:w-20' : 'lg:w-64'} ${open ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`}>
      <div className={`flex h-16 items-center border-b border-slate-800 ${collapsed ? 'justify-center px-3 lg:justify-center' : 'justify-between px-5'}`}>
        <div className={`min-w-0 transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Exchange</p>
          <h1 className="text-lg font-bold tracking-tight text-white">交易后台</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-900 hover:text-white lg:inline-flex"
            onClick={onToggleCollapse}
            title={collapsed ? '展开菜单' : '收起菜单'}
          >
            <ToggleIcon className="h-4 w-4" />
          </button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-900 hover:text-white lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <nav className={`space-y-4 overflow-y-auto pb-32 ${collapsed ? 'p-3' : 'p-4'}`}>
        {allowedGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <div className={`pl-1 pr-4 text-left ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{group.title}</span>
            </div>
            {group.items.map((item) => {
              const active = location === item.path || (location === '/' && item.path === '/dashboard')
              const Icon = item.icon
              return (
                <Link key={item.path} href={item.path} onClick={onClose} title={collapsed ? item.label : undefined} className={`flex items-center rounded-xl text-sm font-medium transition-all ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} ${active ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/40' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}>
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className={`absolute bottom-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all ${collapsed ? 'left-3 right-3 hidden lg:block lg:p-3' : 'left-4 right-4'}`}>
        <p className={`text-sm font-semibold text-slate-200 ${collapsed ? 'lg:hidden' : ''}`}>权限控制已启用</p>
        <p className={`mt-1 text-xs leading-5 text-slate-500 ${collapsed ? 'lg:hidden' : ''}`}>菜单由当前角色的 menu.* 权限动态过滤。</p>
        <ShieldCheck className={`mx-auto h-5 w-5 text-slate-300 ${collapsed ? 'hidden lg:block' : 'hidden'}`} />
      </div>
    </aside>
  )
}
