import { Truck, Utensils } from 'lucide-react';

export const INDUSTRIES = [
  {
    slug: 'transportation-logistics',
    icon: Truck,
    navTitle: 'Transportation & Logistics',
    navDesc: 'Move freight with total visibility across your entire transportation network.',
    label: 'Transportation & Logistics',
    heroTitle: 'Move freight with total visibility',
    points: [
      ['Live GPS + Route History', 'Every vehicle on one map with full historical track playback.'],
      ['Trip Planning & Live ETA', 'Dispatch, monitor progress and share accurate arrival times.'],
      ['Driver Behaviour Insights', 'Overspeed, idling and stoppage reports per vehicle and driver.'],
    ],
    img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80',
  },
  {
    slug: 'food-beverages',
    icon: Utensils,
    navTitle: 'Food & Beverages',
    navDesc: 'Protect perishable cargo with continuous cold-chain monitoring and delivery accuracy.',
    label: 'Food & Beverages',
    heroTitle: 'Keep perishable cargo safe, every mile',
    points: [
      ['Continuous Temperature Sensing', 'IoT probes stream cargo temperature to the platform in real time.'],
      ['Breach Alerts in Seconds', 'Threshold violations trigger instant notifications to your team.'],
      ['On-Time Delivery Tracking', 'Live ETAs keep receiving teams and retailers in sync.'],
    ],
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
  },
];