import {
  LayoutDashboard, Navigation, Truck, Map, Bell, BarChart3, LineChart,
  Radio, SlidersHorizontal, Users, Settings,
} from 'lucide-react';
import { PATHS } from './paths';

// Declarative navigation model. The Sidebar renders entirely from this.
export const NAVIGATION = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: PATHS.DASHBOARD },
  { id: 'tracking', label: 'Live Tracking', icon: Navigation, to: PATHS.TRACKING },
  { id: 'vehicles', label: 'Vehicles', icon: Truck, to: PATHS.VEHICLES },
  { id: 'geofence', label: 'Geofence', icon: Map, to: PATHS.GEOFENCE },
  { id: 'alerts', label: 'Alerts', icon: Bell, to: PATHS.ALERTS, badge: 28 },
  { id: 'reports', label: 'Reports', icon: BarChart3, to: PATHS.REPORTS },
  { id: 'analytics', label: 'Analytics', icon: LineChart, to: PATHS.ANALYTICS },
  { id: 'devices', label: 'IoT Sensors', icon: Radio, to: PATHS.DEVICES },
  { id: 'divider-1', divider: true },
  {
    id: 'admin', label: 'Administration', icon: SlidersHorizontal, group: true,
    children: [
      { id: 'users', label: 'Users & Roles', icon: Users, to: PATHS.USERS },
      { id: 'settings', label: 'Settings', icon: Settings, to: PATHS.SETTINGS },
    ],
  },
];

export default NAVIGATION;
