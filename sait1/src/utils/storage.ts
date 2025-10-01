// src/utils/storage.ts

export const getStorageData = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error("Storage get error:", e);
    return null;
  }
};

export const setStorageData = (data: Record<string, any>) => {
  try {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.error("Storage set error:", e);
  }
};

export const clearStorageData = () => {
  try {
    localStorage.clear();
  } catch (e) {
    console.error("Storage clear error:", e);
  }
};

