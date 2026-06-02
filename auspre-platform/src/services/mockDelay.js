// Simulates network latency so loading/skeleton states are exercised in dev.
// Module services use this until live endpoints are connected.
export const mockDelay = (data, ms = 600) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms));

export default mockDelay;
