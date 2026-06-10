import { mockDelay } from '@/services/mockDelay';

// ─── IMEI catalogue per account ───────────────────────────────────────────────
const IMEI_MAP = {
  ausprey:      [ ['019075197255','KA01AB1234'], ['675080217155','KA05CD5678'], ['675080212529','HR265890'],  ['019075294193','HS001234'],   ['019075197412','3456'],     ['869356078368608','445445'] ],
  techhop:      [ ['358900112233','TH-001'],    ['358900998877','TH-002'],     ['358900445566','TH-003']   ],
  shree_ganesh: [ ['220604285','SG-101'],       ['019075111100','SG-102']     ],
  om_shanti:    [ ['358901001001','OS-201'],    ['358901001002','OS-202'],     ['358901001003','OS-203']   ],
  gautam:       [ ['358902001001','GT-301'],    ['358902001002','GT-302']     ],
  sundaram:     [ ['358903001001','SN-401'],    ['358903001002','SN-402'],     ['358903001003','SN-403']   ],
};
const FALLBACK = [ ['000000000001','DEV-001'], ['000000000002','DEV-002'] ];

export const loadcellService = {

  // Returns the IMEI list for the currently selected account
  getImeis: (accountId) => {
    const list = IMEI_MAP[accountId] ?? FALLBACK;
    return mockDelay(
      list.map(([imei, veh]) => ({ value: imei, label: `${veh} (${imei})` })),
      300
    );
  },

  // Historical data for Load Cell Report — generates a time-series for the chosen range
  getHistoricalData: ({ imei, from, to }) => {
    const start = from ? new Date(from) : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
    const end   = to   ? new Date(to)   : new Date();
    const total = Math.min(Math.floor((end - start) / 60000), 720); // cap at 720 minutes
    const step  = Math.max(1, Math.floor((end - start) / 60000 / 200)); // keep ≤ 200 data points
    const data  = [];

    for (let i = 0; i <= total; i += step) {
      const t   = new Date(start.getTime() + i * 60000);
      const v1  = +(80 + Math.sin(i * 0.12) * 22 + (Math.random() - 0.5) * 8).toFixed(2);
      const v2  = +(75 + Math.cos(i * 0.09) * 18 + (Math.random() - 0.5) * 6).toFixed(2);
      const v3  = +(70 + Math.sin(i * 0.14) * 20 + (Math.random() - 0.5) * 7).toFixed(2);
      const v4  = +(85 + Math.cos(i * 0.11) * 25 + (Math.random() - 0.5) * 9).toFixed(2);
      const avg = +((v1 + v2 + v3 + v4) / 4).toFixed(2);
      data.push({
        time:        t.toISOString(),
        V1:          v1,
        V2:          v2,
        V3:          v3,
        V4:          v4,
        Average:     avg,
        LoadPercent: +(Math.min(100, (avg / 120) * 100)).toFixed(1),
      });
    }

    return mockDelay(data, 800);
  },

  // Live data — last 30 minutes of readings (called every 30 s by LiveLoadPage)
  getLiveData: (imei) => {
    const data = [];
    const now  = new Date();

    for (let i = 30; i >= 0; i--) {
      const t   = new Date(now.getTime() - i * 60000);
      const v1  = +(90 + Math.sin(Date.now() / 10000 + i) * 15 + Math.random() * 5).toFixed(2);
      const v2  = +(82 + Math.cos(Date.now() / 12000 + i) * 12 + Math.random() * 4).toFixed(2);
      const v3  = +(78 + Math.sin(Date.now() / 9000  + i) * 18 + Math.random() * 6).toFixed(2);
      const v4  = +(88 + Math.cos(Date.now() / 11000 + i) * 14 + Math.random() * 5).toFixed(2);
      const avg = +((v1 + v2 + v3 + v4) / 4).toFixed(2);
      data.push({
        time:        t.toISOString(),
        V1:          v1,
        V2:          v2,
        V3:          v3,
        V4:          v4,
        Average:     avg,
        LoadPercent: +(Math.min(100, (avg / 120) * 100)).toFixed(1),
      });
    }

    return mockDelay(data, 400);
  },
};

export default loadcellService;