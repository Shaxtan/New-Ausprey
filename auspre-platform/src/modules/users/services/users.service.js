import { mockDelay } from '@/services/mockDelay';

const stats = { total: 256, active: 213, inactive: 43, totalRoles: 18, administrators: 12 };

const byRole = [
  { name: 'Super Admin', value: 12, color: '#2563eb' },
  { name: 'Fleet Manager', value: 48, color: '#10b981' },
  { name: 'Operations', value: 63, color: '#f59e0b' },
  { name: 'Driver', value: 82, color: '#8b5cf6' },
  { name: 'Maintenance', value: 28, color: '#0ea5e9' },
  { name: 'Viewer', value: 23, color: '#94a3b8' },
];

const users = [
  { id: 1, name: 'Ramesh Kumar', email: 'ramesh.kumar@auspre.com', role: 'Super Admin', status: 'Active', dept: 'Administration', location: 'Bangalore', lastLogin: '2024-05-20T09:30:00' },
  { id: 2, name: 'Amit Singh', email: 'amit.singh@auspre.com', role: 'Fleet Manager', status: 'Active', dept: 'Operations', location: 'Mumbai', lastLogin: '2024-05-20T08:12:00' },
  { id: 3, name: 'Neha Patel', email: 'neha.patel@auspre.com', role: 'Operations', status: 'Active', dept: 'Operations', location: 'Pune', lastLogin: '2024-05-19T17:45:00' },
  { id: 4, name: 'Deepak Sharma', email: 'deepak.sharma@auspre.com', role: 'Driver', status: 'Inactive', dept: 'Logistics', location: 'Delhi', lastLogin: '2024-05-15T11:20:00' },
  { id: 5, name: 'Vikram Singh', email: 'vikram.singh@auspre.com', role: 'Maintenance', status: 'Active', dept: 'Maintenance', location: 'Chennai', lastLogin: '2024-05-20T07:05:00' },
];

const rolePermissions = [
  { role: 'Super Admin', members: 12, permissions: ['Full Access', 'User Mgmt', 'Billing', 'Settings'] },
  { role: 'Fleet Manager', members: 48, permissions: ['Vehicles', 'Tracking', 'Reports', 'Alerts'] },
  { role: 'Operations', members: 63, permissions: ['Tracking', 'Trips', 'Geofence'] },
  { role: 'Driver', members: 82, permissions: ['Mobile App', 'Trips'] },
  { role: 'Viewer', members: 23, permissions: ['Read Only'] },
];

const recentActivities = [
  { id: 1, user: 'Ramesh Kumar', action: 'Updated role permissions for Fleet Manager', time: '2024-05-20T09:32:00' },
  { id: 2, user: 'Amit Singh', action: 'Added new user Kiran Rao', time: '2024-05-20T08:50:00' },
  { id: 3, user: 'Neha Patel', action: 'Exported operations report', time: '2024-05-20T08:15:00' },
  { id: 4, user: 'System', action: 'Deactivated user Deepak Sharma', time: '2024-05-19T22:10:00' },
  { id: 5, user: 'Vikram Singh', action: 'Logged in from a new device', time: '2024-05-19T19:42:00' },
];

const permissionUsage = [
  { name: 'Vehicle Tracking', value: 92, color: '#2563eb' },
  { name: 'Reports', value: 78, color: '#10b981' },
  { name: 'User Management', value: 41, color: '#f59e0b' },
  { name: 'Geofence', value: 63, color: '#8b5cf6' },
  { name: 'Billing', value: 22, color: '#f43f5e' },
];

const statusTrend = [
  { name: 'Jan', active: 180, inactive: 28 }, { name: 'Feb', active: 188, inactive: 30 },
  { name: 'Mar', active: 196, inactive: 34 }, { name: 'Apr', active: 205, inactive: 39 },
  { name: 'May', active: 213, inactive: 43 },
];

export const usersService = {
  getStats: () => mockDelay(stats),
  getByRole: () => mockDelay(byRole),
  getUsers: () => mockDelay(users),
  getRolePermissions: () => mockDelay(rolePermissions),
  getRecentActivities: () => mockDelay(recentActivities),
  getPermissionUsage: () => mockDelay(permissionUsage),
  getStatusTrend: () => mockDelay(statusTrend),
};

export default usersService;
