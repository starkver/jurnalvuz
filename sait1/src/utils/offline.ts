interface OfflineAction {
  type: "insert" | "update" | "delete";
  table: string;
  data: any;
}

const OFFLINE_ACTIONS_KEY = "offline_actions";
const LAST_SYNC_KEY = "last_sync";

export const isOnline = () => navigator.onLine;

export const addOfflineAction = (action: OfflineAction) => {
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_ACTIONS_KEY) || "[]");
    existing.push(action);
    localStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Error adding offline action:", e);
  }
};

export const getOfflineActions = (): OfflineAction[] => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_ACTIONS_KEY) || "[]");
  } catch {
    return [];
  }
};

export const clearOfflineActions = () => {
  localStorage.removeItem(OFFLINE_ACTIONS_KEY);
};

export const updateLastSync = () => {
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
};

export const getLastSync = () => {
  return localStorage.getItem(LAST_SYNC_KEY);
};
