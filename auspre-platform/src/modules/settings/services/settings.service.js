import { mockDelay } from '@/services/mockDelay';

const settings = {
  profile: { name: 'Admin User', email: 'admin@auspre.com', phone: '+91 98000 12345', timezone: 'Asia/Kolkata' },
  organization: { company: 'Auspre Logistics Pvt Ltd', plan: 'Enterprise', seats: 256 },
  notifications: { overspeed: true, geofence: true, maintenance: false, weeklyReport: true, sms: false },
  security: { twoFactor: true, sessionTimeout: '30 minutes', loginAlerts: true },
};

export const settingsService = {
  getSettings: () => mockDelay(settings, 350),
};

export default settingsService;
