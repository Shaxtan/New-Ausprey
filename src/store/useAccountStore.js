import { create } from 'zustand';

export const ACCOUNTS = [
  { id: 'ausprey',         label: 'Ausprey',                  vehicles: 1470 },
  { id: 'techhop',         label: 'Tech-Hop',                 vehicles: 41   },
  { id: 'shree_ganesh',    label: 'Shree Ganesh And Company', vehicles: 33   },
  { id: 'om_shanti',       label: 'Om Shanti Transport',      vehicles: 123  },
  { id: 'gautam',          label: 'GAUTAM TRANSPORT',         vehicles: 52   },
  { id: 'shiv_shakti',     label: 'Shiv Shakti Enterprises',  vehicles: 45   },
  { id: 'kamlesh',         label: 'Kamlesh Shantilal Patel',  vehicles: 44   },
  { id: 'arihant',         label: 'Arihant Agro Sales',       vehicles: 43   },
  { id: 'riddhi',          label: 'Riddhi Enterprises',       vehicles: 34   },
  { id: 'sundaram',        label: 'Sundaram road line',       vehicles: 133  },
  { id: 'natraj',          label: 'Natraj Roadlince',         vehicles: 29   },
  { id: 'rf_chaudhary',    label: 'RF chaudhary',             vehicles: 29   },
  { id: 'hm_traders',      label: 'H M traders',              vehicles: 18   },
];

export const useAccountStore = create((set, get) => ({
  accounts: ACCOUNTS,
  selectedAccount: ACCOUNTS[0],
  setAccount: (accountId) => {
    const found = get().accounts.find((a) => a.id === accountId);
    if (found) set({ selectedAccount: found });
  },
}));

export default useAccountStore;