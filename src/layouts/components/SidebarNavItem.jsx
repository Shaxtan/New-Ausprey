import { NavLink } from 'react-router-dom';
import { cn } from '@/utils';

export function SidebarNavItem({ item, collapsed, sub = false, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-lg text-sm font-medium transition',
          collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5',
          sub && !collapsed && 'py-2',
          isActive ? 'bg-primary text-white' : 'text-sidebar-text hover:bg-sidebar-soft hover:text-[#dbe6f5]'
        )
      }
    >
      <Icon size={sub ? 16 : 18} strokeWidth={2.1} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge != null && (
        <span className="ml-auto text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md bg-red-500">{item.badge}</span>
      )}
      {collapsed && item.badge != null && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500" />}
    </NavLink>
  );
}

export default SidebarNavItem;
