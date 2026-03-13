'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Sun,
  Battery,
  Zap,
  Gauge,
  AlertTriangle,
  BarChart3,
  Settings,
  HelpCircle,
  Building2,
  Home,
  Cable,
  Car,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useSolar } from '@/lib/solar-context'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Power Flow', href: '/power-flow', icon: Zap },
    ],
  },
  {
    title: 'Devices',
    items: [
      { title: 'Solar Panels', href: '/devices/panels', icon: Sun },
      { title: 'Inverters', href: '/devices/inverters', icon: Gauge },
      { title: 'Batteries', href: '/devices/batteries', icon: Battery },
      { title: 'Meters', href: '/devices/meters', icon: Cable },
      { title: 'EV Chargers', href: '/devices/ev-chargers', icon: Car },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { title: 'Alerts', href: '/alerts', icon: AlertTriangle },
      { title: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
]

const footerItems = [
  { title: 'Settings', href: '/settings', icon: Settings },
  { title: 'Help', href: '/help', icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { viewMode, setViewMode, alerts, sites, setSelectedSiteId } = useSolar()
  
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length

  const switchMode = (mode: 'residential' | 'enterprise') => {
    setViewMode(mode)
    const candidate = sites.find((site) => site.mode === mode)
    if (candidate) {
      setSelectedSiteId(candidate.id)
    }
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sun className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">SMS</span>
            <span className="text-xs text-sidebar-foreground/60">Solar Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* View Mode Toggle */}
        <SidebarGroup>
          <SidebarGroupLabel>View Mode</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex gap-1 px-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-0">
              <button
                onClick={() => switchMode('residential')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2',
                  viewMode === 'residential'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Home className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:text-[10px]">Home</span>
              </button>
              <button
                onClick={() => switchMode('enterprise')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2',
                  viewMode === 'enterprise'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Building2 className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:text-[10px]">Enterprise</span>
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Navigation Groups */}
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.title === 'Alerts' && unacknowledgedAlerts > 0 && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                            {unacknowledgedAlerts}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
              Live Data
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
