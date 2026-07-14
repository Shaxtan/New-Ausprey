/**
 * useAlertTriage.js — Alert Dashboard
 *
 * IMPORTANT — honesty note: your backend has no alert-status workflow API
 * (no "acknowledge" / "resolve" endpoint exists on getAlertsByAccount or
 * db-alerts). This hook provides a genuinely useful LOCAL triage tool —
 * Open / Acknowledged / Resolved — that persists in this browser only
 * (localStorage, scoped per account), so it survives refreshes but is NOT
 * synced across devices or users. This is surfaced in the UI as "Tracked
 * locally" rather than silently implied as a server-synced feature.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "alert-triage:";

function load(accid) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PREFIX + accid) || "{}");
  } catch {
    return {};
  }
}

function save(accid, map) {
  try {
    localStorage.setItem(STORAGE_PREFIX + accid, JSON.stringify(map));
  } catch {
    /* storage full or unavailable — triage just won't persist */
  }
}

export function useAlertTriage(accid) {
  const [statusMap, setStatusMap] = useState({}); // { [alertId]: 'acknowledged' | 'resolved' }

  useEffect(() => {
    if (accid == null) return;
    setStatusMap(load(accid));
  }, [accid]);

  const setStatus = useCallback(
    (alertId, status) => {
      setStatusMap((prev) => {
        const next = { ...prev };
        if (status) next[alertId] = status;
        else delete next[alertId]; // reopen
        if (accid != null) save(accid, next);
        return next;
      });
    },
    [accid],
  );

  const acknowledge = useCallback(
    (id) => setStatus(id, "acknowledged"),
    [setStatus],
  );
  const resolve = useCallback((id) => setStatus(id, "resolved"), [setStatus]);
  const reopen = useCallback((id) => setStatus(id, null), [setStatus]);

  /** 'open' | 'acknowledged' | 'resolved' */
  const getStatus = useCallback(
    (alertId) => statusMap[alertId] ?? "open",
    [statusMap],
  );

  return { statusMap, getStatus, acknowledge, resolve, reopen };
}

export default useAlertTriage;
