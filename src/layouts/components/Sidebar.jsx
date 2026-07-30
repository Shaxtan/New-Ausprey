import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X, LifeBuoy } from 'lucide-react';
import { NAVIGATION } from '@/constants';
import { useUIStore } from '@/store';
import { tokens } from '@/themes';
import { cn } from '@/utils';
import { Logo } from './Logo';
import { SidebarNavItem } from './SidebarNavItem';

function SupportCard() {
  return (
    <div className="p-3 shrink-0">
      {/* <div className="rounded-xl p-4 border border-sidebar-line" style={{ background: 'linear-gradient(135deg,#16243d,#1b2f4f)' }}> */}
        {/* <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary"><LifeBuoy size={15} className="text-white" /></div>
          <span className="text-sm font-bold text-white">Need Help?</span>
        </div> */}
        {/* <p className="text-xs leading-relaxed mb-3 text-sidebar-text">Our support team is here to help</p> */}
        {/* <button className="w-full text-xs font-semibold text-white py-2 rounded-lg bg-primary hover:bg-primary-hover transition">Contact Support</button> */}
      {/* </div> */}
    </div>
  );
}

function SidebarContent({ collapsed, onNavigate, onClose }) {
  const location = useLocation();
const [openGroups, setOpenGroups] = useState({ admin: true, iot: true });
const toggleGroup = (id) => setOpenGroups((g) => ({ ...g, [id]: !g[id] }));

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className={cn('relative flex items-center justify-center h-[68px] shrink-0 border-b border-sidebar-line', !collapsed && 'px-5')}>
        {/* -translate-x-2 nudges the logo slightly left of true center.
            Increase to -translate-x-3 / -translate-x-4 for more shift,
            or drop it back to -translate-x-1 for a smaller nudge. Only
            applied when expanded — the collapsed rail is 76px wide, so
            shifting there risks clipping the glyph against the edge. */}
        <Logo compact={collapsed} size={32} className={!collapsed ? '-translate-x-2' : undefined} />
        {onClose && (
          <button
            className="lg:hidden absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
            onClick={onClose}
          >
            <X size={40} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-navy px-3 py-4 space-y-1">
        {NAVIGATION.map((item) => {
          if (item.divider) return <div key={item.id} className="h-px my-3 mx-1 bg-sidebar-line" />;

          if (item.group) {
            const childActive = item.children.some((c) => location.pathname.startsWith(c.to));
            const open = openGroups[item.id];
            const GroupIcon = item.icon;
            return (
              <div key={item.id}>
                <button
                  onClick={() => !collapsed && toggleGroup(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center rounded-lg text-sm font-medium transition',
                    collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5',
                    childActive ? 'text-[#dbe6f5]' : 'text-sidebar-text hover:text-[#dbe6f5]'
                  )}
                >
                  <GroupIcon size={18} strokeWidth={2.1} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      <ChevronDown size={15} className={cn('ml-auto transition-transform', open && 'rotate-180')} />
                    </>
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {!collapsed && open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }} className="overflow-hidden mt-1 ml-3 pl-3 space-y-0.5 border-l border-sidebar-line"
                    >
                      {item.children.map((c) => <SidebarNavItem key={c.id} item={c} sub collapsed={false} onNavigate={onNavigate} />)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return <SidebarNavItem key={item.id} item={item} collapsed={collapsed} onNavigate={onNavigate} />;
        })}
      </nav>

      {!collapsed && <SupportCard />}
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const { sidebarWidth, sidebarCollapsed: collapsedWidth } = tokens.layout;

  // Hover-to-expand — purely local, visual-only state. It never touches
  // the persisted `sidebarCollapsed` preference in the store: when the
  // user has manually collapsed the sidebar, hovering over the collapsed
  // rail temporarily expands it, and moving the mouse away collapses it
  // back. If the sidebar is already expanded, hover has no effect.
  //
  // Page content reflows automatically — no changes needed in
  // DashboardLayout.jsx. The <aside> below is a real flex item
  // (shrink-0) sitting next to the flex-1 content area; when its width
  // changes, flexbox resizes the content area to match, for free.
  const [hovering, setHovering] = useState(false);
  const effectiveCollapsed = sidebarCollapsed && !hovering;
  const width = effectiveCollapsed ? collapsedWidth : sidebarWidth;

  const handleMouseEnter = () => {
    if (sidebarCollapsed) setHovering(true);
  };
  const handleMouseLeave = () => setHovering(false);

  return (
    <>
      <aside
        className="hidden lg:block shrink-0 transition-all duration-300"
        style={{ width }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="fixed top-0 left-0 h-screen transition-all duration-300"
          style={{ width }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SidebarContent collapsed={effectiveCollapsed} />
        </div>
      </aside>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0" style={{ backgroundColor: 'rgba(15,23,42,.5)' }} onClick={closeMobileSidebar} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.25 }}
              className="absolute left-0 top-0 h-full" style={{ width: sidebarWidth }}>
              <SidebarContent collapsed={false} onNavigate={closeMobileSidebar} onClose={closeMobileSidebar} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;