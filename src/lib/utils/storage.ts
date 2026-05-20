export function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback
  }

  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeLocalStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeLocalStorage(key: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(key)
}
