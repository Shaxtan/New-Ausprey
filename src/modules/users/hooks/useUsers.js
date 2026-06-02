import { useQuery } from '@tanstack/react-query';
import { usersService } from '../services/users.service';

const KEY = 'users';
export const useUserStats = () => useQuery({ queryKey: [KEY, 'stats'], queryFn: usersService.getStats });
export const useUsersByRole = () => useQuery({ queryKey: [KEY, 'by-role'], queryFn: usersService.getByRole });
export const useUsers = () => useQuery({ queryKey: [KEY, 'list'], queryFn: usersService.getUsers });
export const useRolePermissions = () => useQuery({ queryKey: [KEY, 'role-perms'], queryFn: usersService.getRolePermissions });
export const useRecentActivities = () => useQuery({ queryKey: [KEY, 'activities'], queryFn: usersService.getRecentActivities });
export const usePermissionUsage = () => useQuery({ queryKey: [KEY, 'perm-usage'], queryFn: usersService.getPermissionUsage });
export const useStatusTrend = () => useQuery({ queryKey: [KEY, 'status-trend'], queryFn: usersService.getStatusTrend });
