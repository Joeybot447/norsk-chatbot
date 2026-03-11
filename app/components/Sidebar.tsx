'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../_lib/supabase/hooks';
import { signOut } from '../_lib/supabase/auth';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import {
  LayoutGrid,
  Globe,
  MessageSquare,
  BookOpen,
  MessagesSquare,
  Monitor,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const planLabels: Record<string, string> = {
  free: 'Gratis',
  starter: 'Starter',
  professional: 'Pro',
  enterprise: 'Enterprise',
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const platformItems: NavItem[] = [
  { label: 'Oversikt', href: '/dashboard', icon: LayoutGrid },
  { label: 'Nettsteder', href: '/dashboard/sites', icon: Globe },
  { label: 'Samtaler', href: '/dashboard', icon: MessageSquare },
  { label: 'Kunnskapsbase', href: '/dashboard/knowledge', icon: BookOpen },
];

const toolItems: NavItem[] = [
  { label: 'Testchat', href: '/dashboard/chat', icon: MessagesSquare },
  { label: 'Widget', href: '/dashboard/widget', icon: Monitor },
  { label: 'Analyse', href: '/dashboard/analytics', icon: BarChart3 },
];

const accountItems: NavItem[] = [
  { label: 'Fakturering', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Innstillinger', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth');
  };

  const userName = user?.displayName || 'Bruker';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const userPlan = user?.plan || 'free';
  const userPlanLabel = planLabels[userPlan] || 'Gratis';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} h-16 px-4 border-b border-slate-200`}>
        <Link href="/dashboard" className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-white" fill="white" stroke="none" />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-semibold text-slate-900 tracking-tight">
              NorskBot
            </span>
          )}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-8 w-8 text-slate-400 hover:text-slate-600 hidden lg:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-5 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors z-10 shadow-sm cursor-pointer"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Platform section */}
        <SectionLabel label="Plattform" collapsed={collapsed} />
        <div className="space-y-0.5">
          {platformItems.map((item) => (
            <NavLink key={item.href + item.label} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
          ))}
        </div>

        <div className={`${collapsed ? 'mx-2' : 'mx-3'} my-3`}>
          <Separator />
        </div>

        {/* Tools section */}
        <SectionLabel label="Verktoy" collapsed={collapsed} />
        <div className="space-y-0.5">
          {toolItems.map((item) => (
            <NavLink key={item.href + item.label} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
          ))}
        </div>

        <div className={`${collapsed ? 'mx-2' : 'mx-3'} my-3`}>
          <Separator />
        </div>

        {/* Account section */}
        <SectionLabel label="Konto" collapsed={collapsed} />
        <div className="space-y-0.5">
          {accountItems.map((item) => (
            <NavLink key={item.href + item.label} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
          ))}
        </div>
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-slate-200">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              {userInitials}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {userName}
                </div>
                <Badge variant="secondary" className="mt-0.5 text-[10px] px-1.5 py-0">
                  {userPlanLabel}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full mt-1 justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Logg ut</span>
            </Button>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm cursor-pointer"
      >
        <Menu className="h-5 w-5 text-slate-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[272px] bg-white flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`${collapsed ? 'w-[68px]' : 'w-[272px]'} bg-white border-r border-slate-200 flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-200 ease-in-out relative hidden lg:flex`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="px-3 mb-2 mt-1">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`
        flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors relative group no-underline
        ${active
          ? 'bg-blue-50 text-blue-600'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }
        ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'}
      `}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
      {!collapsed && <span>{item.label}</span>}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {item.label}
        </span>
      )}
    </Link>
  );
}
