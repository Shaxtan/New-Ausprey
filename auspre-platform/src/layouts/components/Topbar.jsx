import { Menu, ChevronsLeft, Search, HelpCircle, Bell, ChevronDown } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store';
import { Avatar } from '@/components/ui';
import { cn } from '@/utils';

export function Topbar() {
  const { sidebarCollapsed, toggleSidebar, openMobileSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 h-[68px] flex items-center gap-3 px-4 sm:px-6 bg-white/90 backdrop-blur border-b border-slate-200">
      <button className="lg:hidden text-slate-500 p-1" onClick={openMobileSidebar}><Menu size={22} /></button>
      <button onClick={toggleSidebar} className="hidden lg:flex text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition">
        <ChevronsLeft size={18} className={cn('transition-transform', sidebarCollapsed && 'rotate-180')} />
      </button>

      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search anything..." className="ring-focus w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 transition" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
        <button className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"><HelpCircle size={19} /></button>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <Bell size={19} />
          <span className="absolute top-1 right-1 h-4 px-1 text-[9px] font-bold text-white rounded-full flex items-center justify-center bg-red-500">12</span>
        </button>
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l border-slate-200">
          <Avatar name={user?.name ?? 'User'} size={36} />
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-bold text-slate-800">{user?.name}</div>
            <div className="text-xs text-slate-400 font-medium">{user?.role}</div>
          </div>
          <ChevronDown size={15} className="hidden sm:block text-slate-400" />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
