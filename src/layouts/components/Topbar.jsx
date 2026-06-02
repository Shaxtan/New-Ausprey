import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu, ChevronsLeft, Bell, ChevronDown, Search,
  Settings, LogOut, UserCircle, Check, Building2, HelpCircle,
} from 'lucide-react';
import { useUIStore, useAuthStore, useAccountStore } from '@/store';
import { Avatar } from '@/components/ui';
import { PATHS } from '@/constants/paths';
import { cn } from '@/utils';

// ─── Account Selector ────────────────────────────────────────────────────────
function AccountSelector() {
  const { accounts, selectedAccount, setAccount } = useAccountStore();
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref      = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  const filtered = accounts.filter((a) =>
    a.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (account) => {
    setAccount(account.id);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="relative flex items-center gap-1.5" ref={ref}>
      {/* "Select Account" label — desktop only */}
      <span className="hidden lg:block text-sm font-medium text-slate-500 whitespace-nowrap">
        Select Account
      </span>

      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold bg-white transition-all',
          'min-w-[160px] sm:min-w-[190px] max-w-[220px]',
          open
            ? 'border-primary ring-2 ring-primary/20 shadow-sm'
            : 'border-slate-200 hover:border-primary/50 shadow-sm'
        )}
      >
        <Building2 size={15} className="text-primary shrink-0" />
        <span className="truncate flex-1 text-left text-slate-700">
          {selectedAccount.label}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'text-slate-400 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-float overflow-hidden z-50"
          >
            {/* Search */}
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search accounts..."
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-navy py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-5 text-center text-sm text-slate-400">No accounts found</div>
              ) : filtered.map((account) => {
                const active = selectedAccount.id === account.id;
                return (
                  <button
                    key={account.id}
                    onClick={() => handleSelect(account)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition',
                      active ? 'bg-primary/5' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                      active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                    )}>
                      {account.label[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className={cn(
                        'font-semibold truncate text-sm',
                        active ? 'text-primary' : 'text-slate-700'
                      )}>
                        {account.label}
                      </div>
                      <div className="text-xs text-slate-400">{account.vehicles} vehicles</div>
                    </div>
                    {active && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">{accounts.length} accounts</span>
              <span className="text-xs font-semibold text-primary">
                {selectedAccount.vehicles} vehicles active
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────
function UserMenu() {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-3 border-l border-slate-200 py-1 pr-1.5 hover:bg-slate-50 rounded-lg transition"
      >
        <Avatar name={user?.name ?? 'User'} size={34} />
        <div className="hidden sm:block leading-tight text-left">
          <div className="text-sm font-bold text-slate-800 truncate max-w-[100px]">
            {user?.name ?? 'User'}
          </div>
          <div className="text-xs text-slate-400">{user?.role ?? 'Member'}</div>
        </div>
        <ChevronDown
          size={13}
          className={cn('text-slate-400 transition-transform duration-200 shrink-0', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-float overflow-hidden z-50"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <Avatar name={user?.name ?? 'User'} size={40} />
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-800 truncate">{user?.name ?? 'User'}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email ?? '—'}</div>
              </div>
            </div>
            <div className="p-1.5">
              <Link to={PATHS.SETTINGS} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <UserCircle size={16} className="text-slate-400" /> Account settings
              </Link>
              <Link to={PATHS.SETTINGS} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <Settings size={16} className="text-slate-400" /> Preferences
              </Link>
            </div>
            <div className="p-1.5 border-t border-slate-100">
              <button
                onClick={() => { setOpen(false); logout(); navigate(PATHS.LOGIN, { replace: true }); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-600 rounded-lg hover:bg-rose-50 transition"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
export function Topbar() {
  const { sidebarCollapsed, toggleSidebar, openMobileSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-30 h-[68px] flex items-center gap-4 px-4 sm:px-6 bg-white/95 backdrop-blur border-b border-slate-200">

      {/* ── Sidebar controls ── */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="lg:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition"
          onClick={openMobileSidebar}
        >
          <Menu size={20} />
        </button>
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition"
        >
          <ChevronsLeft
            size={18}
            className={cn('transition-transform duration-300', sidebarCollapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* ── Account selector ── */}
      <div className="shrink-0">
        <AccountSelector />
      </div>

      {/* ── Search bar (takes remaining space) ── */}
      <div className="flex-1 hidden md:block max-w-sm lg:max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            placeholder="Search vehicles, trips, alerts..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
        {/* Mobile search */}
        <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <Search size={18} />
        </button>

        {/* Help */}
        <button className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <HelpCircle size={18} />
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[9px] font-bold text-white rounded-full flex items-center justify-center bg-rose-500">
            12
          </span>
        </button>

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}

export default Topbar;