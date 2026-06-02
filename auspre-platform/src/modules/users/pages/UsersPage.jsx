import { useMemo, useState } from 'react';
import { UserPlus, Download } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button, SearchInput, Select } from '@/components/ui';
import { useDebounce } from '@/hooks';
import {
  useUserStats, useUsersByRole, useUsers, useRolePermissions,
  useRecentActivities, usePermissionUsage, useStatusTrend,
} from '../hooks/useUsers';
import { UsersStats } from '../components/UsersStats';
import { UsersByRoleCard } from '../components/UsersByRoleCard';
import { UsersTable } from '../components/UsersTable';
import { RolePermissionsCard } from '../components/RolePermissionsCard';
import { RecentActivitiesCard } from '../components/RecentActivitiesCard';
import { PermissionUsageCard } from '../components/PermissionUsageCard';
import { UserStatusTrendCard } from '../components/UserStatusTrendCard';
import { AddUserModal } from '../components/AddUserModal';

export default function UsersPage() {
  const stats = useUserStats();
  const byRole = useUsersByRole();
  const users = useUsers();
  const rolePerms = useRolePermissions();
  const activities = useRecentActivities();
  const permUsage = usePermissionUsage();
  const statusTrend = useStatusTrend();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All Roles');
  const [status, setStatus] = useState('All Status');
  const [adding, setAdding] = useState(false);
  const debounced = useDebounce(search, 250);

  const filtered = useMemo(() => {
    const list = users.data ?? [];
    return list.filter((u) =>
      (role === 'All Roles' || u.role === role) &&
      (status === 'All Status' || u.status === status) &&
      (u.name.toLowerCase().includes(debounced.toLowerCase()) || u.email.toLowerCase().includes(debounced.toLowerCase()))
    );
  }, [users.data, debounced, role, status]);

  const toolbar = (
    <div className="flex flex-col lg:flex-row lg:items-center gap-2 mt-3">
      <SearchInput placeholder="Search users by name or email..." value={search} onChange={setSearch} className="w-full lg:w-72" />
      <Select value={role} onChange={setRole} options={['All Roles', 'Super Admin', 'Fleet Manager', 'Operations', 'Driver', 'Maintenance', 'Viewer']} className="w-full lg:w-44" />
      <Select value={status} onChange={setStatus} options={['All Status', 'Active', 'Inactive']} className="w-full lg:w-36" />
    </div>
  );

  return (
    <div>
      <PageHeader
        crumbs={['Administration', 'Users & Roles']}
        title="Users & Roles"
        description="Manage team members, roles and granular permissions across the platform."
        actions={<><Button variant="secondary" icon={Download}>Export</Button><Button icon={UserPlus} onClick={() => setAdding(true)}>Add User</Button></>}
      />

      <UsersStats stats={stats.data} loading={stats.isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        <div className="lg:col-span-4"><UsersByRoleCard data={byRole.data ?? []} loading={byRole.isLoading} /></div>
        <div className="lg:col-span-8"><UsersTable data={filtered} loading={users.isLoading} total={stats.data?.total ?? 0} toolbar={toolbar} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        <div className="lg:col-span-5"><RolePermissionsCard data={rolePerms.data ?? []} loading={rolePerms.isLoading} /></div>
        <div className="lg:col-span-7"><RecentActivitiesCard data={activities.data ?? []} loading={activities.isLoading} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5"><PermissionUsageCard data={permUsage.data ?? []} loading={permUsage.isLoading} /></div>
        <div className="lg:col-span-7"><UserStatusTrendCard data={statusTrend.data ?? []} loading={statusTrend.isLoading} /></div>
      </div>

      <AddUserModal open={adding} onClose={() => setAdding(false)} onSubmit={() => {}} />
    </div>
  );
}
