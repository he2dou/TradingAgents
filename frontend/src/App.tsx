// 设计提醒：应用入口负责稳定路由壳层，包含公开认证页、受保护后台页、权限路由和 404 兜底。
import { useEffect } from 'react'
import { Route, Router, Switch, useLocation } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ResearchNotificationsProvider } from '@/contexts/ResearchNotificationsContext'
import Layout from '@/components/Layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Exchange from '@/pages/Exchange'
import Positions from '@/pages/Positions'
import Research from '@/pages/Research'
import News from '@/pages/News'
import Orders from '@/pages/Orders'
import Assets from '@/pages/Assets'
import Trades from '@/pages/Trades'
import Users from '@/pages/Users'
import SystemSettings from '@/pages/SystemSettings'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import NotFound from '@/pages/NotFound'
import type { PermissionKey } from '@/mock/permission'

const routePermissions: Record<string, PermissionKey> = {
  '/dashboard': 'menu.dashboard',
  '/exchange': 'menu.exchange',
  '/positions': 'menu.positions',
  '/orders': 'menu.orders',
  '/assets': 'menu.assets',
  '/trades': 'menu.trades',
  '/research': 'menu.research',
  '/news': 'menu.news',
  '/users': 'menu.users',
  '/settings': 'menu.settings',
}

const publicRoutes = ['/login', '/register']

function ProtectedShell() {
  const [location, navigate] = useLocation()
  const { isAuthenticated, isLoading, can } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (location === '/') {
      navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true })
      return
    }
    if (!isAuthenticated && !publicRoutes.includes(location)) {
      navigate('/login', { replace: true })
      return
    }
    const required = routePermissions[location]
    if (isAuthenticated && required && !can(required)) {
      navigate('/dashboard', { replace: true })
    }
  }, [location, navigate, isAuthenticated, can, isLoading])

  if (isLoading) return null
  if (!isAuthenticated && !publicRoutes.includes(location) && location !== '/') return null
  if (publicRoutes.includes(location)) return <PublicRoutes />

  return (
    <Layout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/exchange" component={Exchange} />
        <Route path="/positions" component={Positions} />
        <Route path="/orders" component={Orders} />
        <Route path="/assets" component={Assets} />
        <Route path="/trades" component={Trades} />
        <Route path="/research" component={Research} />
        <Route path="/news" component={News} />
        <Route path="/users" component={Users} />
        <Route path="/settings" component={SystemSettings} />
        <Route path="/" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  )
}

function PublicRoutes() {
  const [location, navigate] = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated && publicRoutes.includes(location)) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, location, navigate])

  if (isLoading) return null

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  )
}

function AppRouter() {
  return (
    <Router hook={useHashLocation}>
      <ProtectedShell />
    </Router>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <ResearchNotificationsProvider>
            <TooltipProvider>
              <Toaster />
              <AppRouter />
            </TooltipProvider>
          </ResearchNotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
