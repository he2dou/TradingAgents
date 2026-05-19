// 设计提醒：权限数据以“角色-菜单-操作”三层结构呈现，让模板具备可复用的 RBAC 雏形。
export type RoleKey = 'super_admin' | 'risk_manager' | 'finance_operator' | 'auditor'

export type PermissionKey =
  | 'menu.dashboard'
  | 'menu.exchange'
  | 'menu.positions'
  | 'menu.orders'
  | 'menu.assets'
  | 'menu.trades'
  | 'menu.research'
  | 'menu.news'
  | 'menu.users'
  | 'exchange.placeOrder'
  | 'positions.view'
  | 'positions.create'
  | 'positions.edit'
  | 'positions.delete'
  | 'positions.close'
  | 'positions.risk'
  | 'orders.detail'
  | 'orders.cancel'
  | 'assets.view'
  | 'assets.create'
  | 'assets.edit'
  | 'assets.delete'
  | 'assets.freeze'
  | 'trades.export'
  | 'research.view'
  | 'research.generate'
  | 'research.cancel'
  | 'research.delete'
  | 'research.download'
  | 'research.bookmark'
  | 'news.view'
  | 'news.bookmark'
  | 'news.markRead'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.disable'
  | 'roles.assign'
  | 'menu.settings'
  | 'settings.view'
  | 'settings.edit'

export const permissionLabels: Record<PermissionKey, string> = {
  'menu.dashboard': '访问仪表盘',
  'menu.exchange': '访问买卖交易',
  'menu.positions': '访问持仓管理',
  'menu.orders': '访问订单管理',
  'menu.assets': '访问资产管理',
  'menu.trades': '访问成交记录',
  'menu.research': '访问研报中心',
  'menu.news': '访问新闻资讯',
  'menu.users': '访问用户/权限管理',
  'exchange.placeOrder': '提交买卖委托',
  'positions.view': '查看持仓',
  'positions.create': '新增持仓',
  'positions.edit': '编辑持仓',
  'positions.delete': '删除持仓',
  'positions.close': '模拟平仓',
  'positions.risk': '设置止盈止损',
  'orders.detail': '查看订单详情',
  'orders.cancel': '撤销订单',
  'assets.view': '查看资产',
  'assets.create': '新增资产',
  'assets.edit': '编辑资产',
  'assets.delete': '删除资产',
  'assets.freeze': '冻结资产',
  'trades.export': '导出成交记录',
  'research.view': '查看研报',
  'research.generate': '生成研报',
  'research.cancel': '取消研报任务',
  'research.delete': '删除研报',
  'research.download': '下载研报',
  'research.bookmark': '收藏研报',
  'news.view': '查看新闻',
  'news.bookmark': '收藏新闻',
  'news.markRead': '标记已读',
  'users.view': '查看用户',
  'users.create': '新增用户',
  'users.edit': '编辑用户',
  'users.disable': '禁用用户',
  'roles.assign': '分配角色',
  'menu.settings': '访问系统设置',
  'settings.view': '查看系统设置',
  'settings.edit': '编辑系统设置',
}

export const mockRoles: { key: RoleKey; name: string; description: string; permissions: PermissionKey[] }[] = [
  {
    key: 'super_admin',
    name: '超级管理员',
    description: '拥有全部菜单和操作权限，适合系统负责人。',
    permissions: ['menu.dashboard', 'menu.exchange', 'menu.positions', 'menu.orders', 'menu.assets', 'menu.trades', 'menu.research', 'menu.research', 'menu.news', 'menu.users', 'menu.settings', 'orders.detail', 'orders.cancel', 'assets.view', 'assets.create', 'assets.edit', 'assets.delete', 'assets.freeze', 'trades.export', 'users.view', 'users.create', 'users.edit', 'users.disable', 'roles.assign', 'exchange.placeOrder', 'positions.view', 'positions.create', 'positions.edit', 'positions.delete', 'positions.close', 'positions.risk', 'research.view', 'research.generate', 'research.cancel', 'research.delete', 'research.download', 'research.bookmark', 'news.view', 'news.bookmark', 'news.markRead', 'settings.view', 'settings.edit'],
  },
  {
    key: 'risk_manager',
    name: '风控经理',
    description: '关注订单、成交和风险处置，可查看用户但不可分配角色。',
    permissions: ['menu.dashboard', 'menu.exchange', 'menu.positions', 'menu.orders', 'menu.trades', 'menu.research', 'menu.news', 'menu.users', 'menu.settings', 'orders.detail', 'orders.cancel', 'trades.export', 'users.view', 'exchange.placeOrder', 'positions.view', 'positions.create', 'positions.edit', 'positions.delete', 'positions.close', 'positions.risk', 'research.view', 'research.generate', 'research.cancel', 'research.delete', 'research.download', 'research.bookmark', 'news.view', 'news.bookmark', 'news.markRead', 'settings.view'],
  },
  {
    key: 'finance_operator',
    name: '财务运营',
    description: '负责资产核对与资金冻结，不进入用户管理。',
    permissions: ['menu.dashboard', 'menu.positions', 'menu.assets', 'menu.trades', 'menu.research', 'menu.news', 'assets.view', 'assets.create', 'assets.edit', 'assets.delete', 'assets.freeze', 'positions.view', 'positions.create', 'positions.edit', 'positions.delete', 'research.view', 'research.generate', 'research.cancel', 'news.view'],
  },
  {
    key: 'auditor',
    name: '审计员',
    description: '只读角色，仅能查看仪表盘、订单、资产与成交记录。',
    permissions: ['menu.dashboard', 'menu.positions', 'menu.orders', 'menu.assets', 'menu.trades', 'orders.detail', 'assets.view', 'positions.view', 'research.view', 'news.view'],
  },
]

export const mockUsers = [
  { id: 'USR-1001', name: '林澈', email: 'lin.che@example.com', role: '超级管理员', status: '启用', lastLogin: '2026-05-11 09:25:18', mfa: '已开启' },
  { id: 'USR-1002', name: '周燃', email: 'zhou.ran@example.com', role: '风控经理', status: '启用', lastLogin: '2026-05-11 08:41:02', mfa: '已开启' },
  { id: 'USR-1003', name: '许宁', email: 'xu.ning@example.com', role: '财务运营', status: '启用', lastLogin: '2026-05-10 21:16:44', mfa: '未开启' },
  { id: 'USR-1004', name: '陈安', email: 'chen.an@example.com', role: '审计员', status: '停用', lastLogin: '2026-05-08 18:22:09', mfa: '已开启' },
  { id: 'USR-1005', name: '王屿', email: 'wang.yu@example.com', role: '风控经理', status: '启用', lastLogin: '2026-05-11 07:52:33', mfa: '已开启' },
  { id: 'USR-1006', name: '赵岚', email: 'zhao.lan@example.com', role: '财务运营', status: '启用', lastLogin: '2026-05-09 16:08:51', mfa: '未开启' },
]
