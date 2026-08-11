import {
  LayoutDashboard,
  Navigation,
  MapPin,
  Truck,
  Route,
  Map,
  Bell,
  BarChart3,
  LineChart,
  Radio,
  BarChart2,
  Activity,
  Sparkles,
  SlidersHorizontal,
  Users,
  Settings,
} from "lucide-react";
import { PATHS } from "./paths";

export const NAVIGATION = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    to: PATHS.DASHBOARD,
  },
  {
    id: "fleet-intel",
    label: "Fleet Intelligence",
    icon: Sparkles,
    to: PATHS.FLEET_INTEL,
  },
  {
    id: "tracking",
    label: "Live Tracking",
    icon: Navigation,
    to: PATHS.TRACKING,
  },
  { id: "map", label: "Map View", icon: MapPin, to: PATHS.MAP },
  { id: "vehicles", label: "Vehicles", icon: Truck, to: PATHS.VEHICLES },
  { id: "trips", label: "Trips", icon: Route, to: PATHS.TRIPS },
  { id: "geofence", label: "Geofence", icon: Map, to: PATHS.GEOFENCE },
  { id: "alerts", label: "Alerts", icon: Bell, to: PATHS.ALERTS, badge: 28 },
  { id: "reports", label: "Reports", icon: BarChart3, to: PATHS.REPORTS },
  { id: "analytics", label: "Analytics", icon: LineChart, to: PATHS.ANALYTICS },
  { id: "devices", label: "IoT Sensors", icon: Radio, to: PATHS.DEVICES },
  {
    id: "load-cell",
    label: "Load Sensor Report",
    icon: BarChart2,
    to: PATHS.LOAD_CELL,
  },
  {
    id: "live-load",
    label: "Live Load Sensor",
    icon: Activity,
    to: PATHS.LIVE_LOAD,
  },
  { id: "divider-1", divider: true },
  // {
  //   id: "admin",
  //   label: "Administration",
  //   icon: SlidersHorizontal,
  //   group: true,
  //   children: [
  //     { id: "users", label: "Users & Roles", icon: Users, to: PATHS.USERS },
  //     { id: "settings", label: "Settings", icon: Settings, to: PATHS.SETTINGS },
  //   ],
  // },
];

export default NAVIGATION;
