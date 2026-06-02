import { mockDelay } from '@/services/mockDelay';

const stats = { total: 1245, active: 1034, maintenance: 38, idle: 156 };

const vehicles = [
  { id: 1, reg: 'KA01AB1234', model: 'Tata Ace', status: 'Moving', driver: 'Ramesh Kumar', location: 'Bangalore', speed: 56, odometer: 84210, fuel: 72, lastUpdate: '2024-05-20T10:23:00' },
  { id: 2, reg: 'KA05CD5678', model: 'Ashok Leyland Dost', status: 'Moving', driver: 'Amit Singh', location: 'Tumkur', speed: 48, odometer: 120540, fuel: 41, lastUpdate: '2024-05-20T10:21:00' },
  { id: 3, reg: 'KA03EF9012', model: 'Mahindra Bolero', status: 'Stopped', driver: 'Neha Patel', location: 'Mysore', speed: 0, odometer: 65120, fuel: 88, lastUpdate: '2024-05-20T09:58:00' },
  { id: 4, reg: 'KA02GH3456', model: 'Tata 407', status: 'Moving', driver: 'Deepak Sharma', location: 'Hassan', speed: 63, odometer: 152300, fuel: 55, lastUpdate: '2024-05-20T10:24:00' },
  { id: 5, reg: 'KA04IJ7890', model: 'Eicher Pro', status: 'Idle', driver: 'Vikram Singh', location: 'Mandya', speed: 0, odometer: 98760, fuel: 30, lastUpdate: '2024-05-20T10:05:00' },
  { id: 6, reg: 'KA09KL2345', model: 'Tata Ultra', status: 'Moving', driver: 'Suresh Yadav', location: 'Bangalore', speed: 51, odometer: 45230, fuel: 64, lastUpdate: '2024-05-20T10:22:00' },
  { id: 7, reg: 'KA11MN6789', model: 'Ashok Leyland Partner', status: 'Stopped', driver: 'Rahul Verma', location: 'Hubli', speed: 0, odometer: 73450, fuel: 19, lastUpdate: '2024-05-20T09:40:00' },
  { id: 8, reg: 'KA07OP3456', model: 'Mahindra Jeeto', status: 'Moving', driver: 'Kiran Rao', location: 'Belgaum', speed: 44, odometer: 31200, fuel: 77, lastUpdate: '2024-05-20T10:20:00' },
];

export const vehiclesService = {
  getStats: () => mockDelay(stats),
  getVehicles: () => mockDelay(vehicles),
};

export default vehiclesService;
