// Shared by extension-core and apps/extension (see their vitest.config.mts).
import cloneDeep from "lodash-es/cloneDeep"
import { WebSocket } from "mock-socket"
import sinonChrome from "sinon-chrome"
import { vi } from "vitest"

globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket

type Changes = Record<string, { newValue?: unknown; oldValue?: unknown }>
type ChangeListener = (changes: Changes, areaName: string) => void
type Callback<T> = ((result: T) => void) | undefined

const storageListeners = new Set<ChangeListener>()

/**
 * An in-memory `chrome.storage` area: promise and callback styles, and `storage.onChanged`
 * fires on every write, as in the browser.
 */
const createStorageArea = (areaName: string) => {
  let data: Record<string, unknown> = {}
  const notify = (changes: Changes) => {
    if (!Object.keys(changes).length) return
    storageListeners.forEach((listener) => listener(changes, areaName))
  }
  const done = <T>(result: T, cb?: Callback<T>) => {
    cb?.(result)
    return Promise.resolve(result)
  }

  return {
    get: vi.fn(
      (
        keys?: string | string[] | Record<string, unknown> | null,
        cb?: Callback<Record<string, unknown>>,
      ) => {
        if (typeof keys === "function") return done(cloneDeep(data), keys)
        if (keys === null || keys === undefined) return done(cloneDeep(data), cb)
        const defaults: Record<string, unknown> =
          typeof keys === "string"
            ? { [keys]: undefined }
            : Array.isArray(keys)
              ? Object.fromEntries(keys.map((key) => [key, undefined]))
              : keys
        const result: Record<string, unknown> = {}
        for (const [key, fallback] of Object.entries(defaults)) {
          const value = key in data ? data[key] : fallback
          if (value !== undefined) result[key] = cloneDeep(value)
        }
        return done(result, cb)
      },
    ),
    set: vi.fn((items: Record<string, unknown>, cb?: Callback<void>) => {
      const changes: Changes = {}
      for (const [key, value] of Object.entries(items)) {
        changes[key] = { oldValue: data[key], newValue: cloneDeep(value) }
        data[key] = cloneDeep(value)
      }
      notify(changes)
      return done(undefined, cb)
    }),
    remove: vi.fn((keys: string | string[], cb?: Callback<void>) => {
      const changes: Changes = {}
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        if (!(key in data)) continue
        changes[key] = { oldValue: data[key] }
        delete data[key]
      }
      notify(changes)
      return done(undefined, cb)
    }),
    clear: vi.fn((cb?: Callback<void>) => {
      const changes: Changes = Object.fromEntries(
        Object.entries(data).map(([key, oldValue]) => [key, { oldValue }]),
      )
      data = {}
      notify(changes)
      return done(undefined, cb)
    }),
    getBytesInUse: vi.fn((_keys?: unknown, cb?: Callback<number>) =>
      done(JSON.stringify(data).length, cb),
    ),
  }
}

const createEvent = <T extends (...args: never[]) => unknown>() => {
  const listeners = new Set<T>()
  return {
    listeners,
    addListener: vi.fn((listener: T) => void listeners.add(listener)),
    removeListener: vi.fn((listener: T) => void listeners.delete(listener)),
    hasListener: vi.fn((listener: T) => listeners.has(listener)),
    hasListeners: vi.fn(() => listeners.size > 0),
  }
}

const createPort = (name = ""): chrome.runtime.Port => {
  const onDisconnect = createEvent<(port: chrome.runtime.Port) => void>()
  const onMessage = createEvent<(message: unknown, port: chrome.runtime.Port) => void>()
  const port = {
    name,
    postMessage: vi.fn(),
    disconnect: vi.fn(() => onDisconnect.listeners.forEach((listener) => listener(port))),
    onDisconnect,
    onMessage,
  } as unknown as chrome.runtime.Port
  return port
}

// sinon-chrome stubs every API; storage, ports, URLs and windows need to behave like the real thing
const chromeMock = {
  ...sinonChrome,
  storage: {
    ...sinonChrome.storage,
    local: createStorageArea("local"),
    session: createStorageArea("session"),
    sync: createStorageArea("sync"),
    onChanged: {
      addListener: vi.fn((listener: ChangeListener) => void storageListeners.add(listener)),
      removeListener: vi.fn((listener: ChangeListener) => void storageListeners.delete(listener)),
      hasListener: vi.fn((listener: ChangeListener) => storageListeners.has(listener)),
      hasListeners: vi.fn(() => storageListeners.size > 0),
    },
  },
  runtime: {
    ...sinonChrome.runtime,
    id: "taostats-wallet-test",
    connect: vi.fn((idOrInfo?: string | chrome.runtime.ConnectInfo) =>
      createPort(typeof idOrInfo === "string" ? idOrInfo : idOrInfo?.name),
    ),
    getURL: vi.fn(
      (path: string) => `chrome-extension://taostats-wallet-test/${path.replace(/^\//, "")}`,
    ),
    getManifest: vi.fn(() => ({ manifest_version: 3, name: "Taostats", version: "0.0.0" })),
  },
  windows: {
    ...sinonChrome.windows,
    // webextension-polyfill callers expect a promise
    create: (...args: Parameters<typeof sinonChrome.windows.create>) =>
      Promise.resolve(sinonChrome.windows.create(...args)),
  },
  alarms: sinonChrome.alarms,
}

globalThis.chrome = chromeMock as unknown as typeof chrome
// webextension-polyfill uses `globalThis.browser` as-is when it's there
;(globalThis as unknown as { browser: unknown }).browser = chromeMock

// jest-fetch-mock used to answer every request with an empty 200; keep tests off the network
globalThis.fetch = vi.fn(async () => new Response("")) as unknown as typeof fetch

process.env.VERSION = process.env.npm_package_version ?? "0.0.0"

// hides the polkadot-js esm/cjs warning that shows up for every test
// https://github.com/polkadot-js/api/issues/5636
process.env.POLKADOTJS_DISABLE_ESM_CJS_WARNING = "1"

// somehow not available in jsdom
globalThis.structuredClone = cloneDeep

// remove useless warnings
/* eslint-disable no-console */
const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  const msg = (args[0] as { toString?: () => string } | undefined)?.toString?.()
  // bigint-buffer fails to load its native binding and falls back to pure JavaScript
  if (msg?.includes("bigint: Failed to load bindings")) return
  originalWarn(...args)
}
/* eslint-enable no-console */
