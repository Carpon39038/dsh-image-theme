import { DEFAULT_CONFIG, type StoredTheme } from './types.ts'

const DATABASE = 'dsh-image-theme'
const STORE = 'assets'
const IMAGE_KEY = 'background'
const SETTINGS_KEY = 'dsh-image-theme/settings-v1'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE)
    }
    request.onsuccess = () => { resolve(request.result) }
    request.onerror = () => { reject(request.error ?? new Error('Could not open image storage.')) }
  })
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE, mode)
      const request = action(transaction.objectStore(STORE))
      request.onsuccess = () => { resolve(request.result) }
      request.onerror = () => { reject(request.error ?? new Error('Image storage operation failed.')) }
    })
  } finally {
    database.close()
  }
}

export function readThemeSettings(): StoredTheme | null {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (raw === null) return null
  try {
    const value = JSON.parse(raw) as Partial<StoredTheme>
    if (value.version !== 1 || typeof value.fileName !== 'string' || !Array.isArray(value.palette?.colors)) return null
    return {
      version: 1,
      fileName: value.fileName,
      palette: { colors: value.palette.colors.filter((color): color is string => typeof color === 'string').slice(0, 5) },
      config: { ...DEFAULT_CONFIG, ...value.config },
    }
  } catch {
    return null
  }
}

export function writeThemeSettings(value: StoredTheme): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(value))
}

export function clearThemeSettings(): void {
  localStorage.removeItem(SETTINGS_KEY)
}

export async function readBackgroundImage(): Promise<Blob | null> {
  return withStore('readonly', store => store.get(IMAGE_KEY) as IDBRequest<Blob | undefined>)
    .then(value => value ?? null)
}

export async function writeBackgroundImage(blob: Blob): Promise<void> {
  await withStore('readwrite', store => store.put(blob, IMAGE_KEY))
}

export async function clearBackgroundImage(): Promise<void> {
  await withStore('readwrite', store => store.delete(IMAGE_KEY))
}
