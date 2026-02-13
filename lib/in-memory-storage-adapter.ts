import type { SupportedStorage } from '@supabase/supabase-js';

class InMemoryStorageAdapter implements SupportedStorage {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    const value = this.storage.get(key) || null;
    console.log(`[InMemoryStorage] GET "${key}":`, value ? 'found' : 'not found');
    return value;
  }

  setItem(key: string, value: string): void {
    console.log(`[InMemoryStorage] SET "${key}" (${value.substring(0, 50)}...)`);
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    console.log(`[InMemoryStorage] REMOVE "${key}"`);
    this.storage.delete(key);
  }
}

export const inMemoryStorage = new InMemoryStorageAdapter();

export function createStorageAdapter(): SupportedStorage {
  if (typeof window === 'undefined') {
    return inMemoryStorage;
  }

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);

    console.log('[Storage] ✅ localStorage available, using native storage');

    return {
      getItem: (key: string) => {
        const value = window.localStorage.getItem(key);
        console.log(`[LocalStorage] GET "${key}":`, value ? 'found' : 'not found');
        return value;
      },
      setItem: (key: string, value: string) => {
        console.log(`[LocalStorage] SET "${key}"`);
        window.localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        console.log(`[LocalStorage] REMOVE "${key}"`);
        window.localStorage.removeItem(key);
      },
    };
  } catch (e) {
    console.warn('[Storage] ❌ localStorage blocked, using in-memory storage');
    console.warn('[Storage] ⚠️  Sessions will NOT persist across page reloads');
    return inMemoryStorage;
  }
}
