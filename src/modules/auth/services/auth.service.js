import { mockDelay } from '@/services/mockDelay';

// Mock auth API. Swap each body for apiClient.post('/auth/...') when live.
const makeToken = () => `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

const titleCase = (str) =>
  str.split(/[._\-\s]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

export const authService = {
  login: ({ email, password }) => {
    if (!email || !password) return Promise.reject({ message: 'Email and password are required.' });
    if (password.length < 6) return Promise.reject({ message: 'Invalid credentials. Please try again.' });
    return mockDelay(
      { token: makeToken(), user: { name: titleCase(email.split('@')[0] || 'User'), email, role: 'Fleet Manager' } },
      700
    );
  },

  signup: ({ name, email, password, company }) => {
    if (!name || !email || !password) return Promise.reject({ message: 'Please complete all required fields.' });
    if (password.length < 6) return Promise.reject({ message: 'Password must be at least 6 characters.' });
    return mockDelay(
      { token: makeToken(), user: { name, email, role: 'Fleet Manager', company: company || null } },
      800
    );
  },
};

export default authService;