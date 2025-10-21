// src/hooks/useLocalStorage.js
import { useState, useEffect } from "react";

/**
 * Custom hook for managing localStorage with React state
 * Provides automatic synchronization between localStorage and component state
 */
export function useLocalStorage(key, initialValue) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      if (typeof window !== "undefined") {
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove item from localStorage
  const removeValue = () => {
    try {
      setStoredValue(undefined);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}

/**
 * Hook specifically for managing authentication token
 */
export function useAuthToken() {
  return useLocalStorage("token", null);
}

/**
 * Hook specifically for managing user data
 */
export function useUserData() {
  return useLocalStorage("user", null);
}

/**
 * Hook for managing theme preferences
 */
export function useTheme() {
  return useLocalStorage("theme", "light");
}

/**
 * Hook for managing user preferences
 */
export function useUserPreferences() {
  return useLocalStorage("userPreferences", {
    language: "id",
    itemsPerPage: 10,
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
  });
}

/**
 * Hook for managing recently viewed items
 */
export function useRecentItems(itemType) {
  const key = `recent_${itemType}`;
  const [items, setItems] = useLocalStorage(key, []);

  const addRecentItem = (item) => {
    setItems((prevItems) => {
      // Remove if already exists
      const filtered = prevItems.filter((i) => i.id !== item.id);
      // Add to beginning and limit to 10 items
      return [item, ...filtered].slice(0, 10);
    });
  };

  const removeRecentItem = (itemId) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
  };

  const clearRecentItems = () => {
    setItems([]);
  };

  return {
    items,
    addRecentItem,
    removeRecentItem,
    clearRecentItems,
  };
}

/**
 * Hook for managing form draft data
 */
export function useFormDraft(formKey) {
  const key = `draft_${formKey}`;
  const [draft, setDraft, removeDraft] = useLocalStorage(key, null);

  const saveDraft = (formData) => {
    setDraft({
      data: formData,
      timestamp: new Date().toISOString(),
    });
  };

  const clearDraft = () => {
    removeDraft();
  };

  const hasDraft = draft && draft.data;

  return {
    draft: draft?.data || null,
    timestamp: draft?.timestamp || null,
    saveDraft,
    clearDraft,
    hasDraft,
  };
}

export default useLocalStorage;
