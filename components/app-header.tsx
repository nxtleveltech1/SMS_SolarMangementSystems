'use client'

import { useState, useEffect } from 'react'
import { Bell, Moon, Sun, RefreshCw, Search, User, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useSolar } from '@/lib/solar-context'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const {
    alerts,
    updatePreferences,
    refreshData,
    site,
    viewMode,
    sites,
    selectedSiteId,
    setSelectedSiteId,
  } = useSolar()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged)
  const criticalAlerts = unacknowledgedAlerts.filter(a => a.severity === 'critical')

  const handleRefresh = () => {
    setIsRefreshing(true)
    refreshData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const toggleDarkMode = () => {
    const isDark = theme === 'dark'
    updatePreferences({ darkMode: !isDark })
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      
      <div className="flex flex-1 items-center gap-4">
        {/* Site Info */}
        <div className="hidden min-w-[230px] md:flex md:flex-col">
          <span className="text-sm font-medium text-foreground">{site?.name || 'Loading...'}</span>
          <span className="text-xs text-muted-foreground">
            {viewMode === 'enterprise' ? 'Commercial Plant' : 'Residential System'} 
            {site?.capacity ? ` - ${site.capacity} kWp` : ''}
          </span>
        </div>

        {/* Site switcher */}
        <div className="hidden md:block">
          <select
            value={selectedSiteId ?? ''}
            onChange={(event) => setSelectedSiteId(event.target.value)}
            className="h-9 min-w-[180px] rounded-md border border-input bg-background px-3 text-sm"
          >
            {sites.map((siteOption) => (
              <option key={siteOption.id} value={siteOption.id}>
                {siteOption.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative ml-auto max-w-sm flex-1 md:ml-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search devices, alerts..."
            className="w-full bg-secondary/50 pl-8 md:w-[200px] lg:w-[300px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="h-8 w-8"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          <span className="sr-only">Refresh data</span>
        </Button>

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="h-8 w-8"
        >
          {!mounted ? (
            <span className="h-4 w-4" aria-hidden />
          ) : theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle dark mode</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {unacknowledgedAlerts.length > 0 && (
                <span
                  className={cn(
                    'absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium',
                    criticalAlerts.length > 0
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-warning text-warning-foreground'
                  )}
                >
                  {unacknowledgedAlerts.length}
                </span>
              )}
              <span className="sr-only">View notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unacknowledgedAlerts.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {unacknowledgedAlerts.length} unread
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {unacknowledgedAlerts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              unacknowledgedAlerts.slice(0, 5).map((alert) => (
                <DropdownMenuItem
                  key={alert.id}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="flex w-full items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        alert.severity === 'critical' && 'bg-destructive',
                        alert.severity === 'warning' && 'bg-warning',
                        alert.severity === 'info' && 'bg-primary'
                      )}
                    />
                    <span className="flex-1 text-sm font-medium">{alert.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="pl-4 text-xs text-muted-foreground line-clamp-2">
                    {alert.message}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            {unacknowledgedAlerts.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-sm text-primary">
                  View all {unacknowledgedAlerts.length} alerts
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="hidden md:inline-block">Admin</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
