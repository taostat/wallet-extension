import type { Browser } from "webextension-polyfill"
import { vi } from "vitest"

vi.mock("bcryptjs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("bcryptjs")>()),
  genSalt: vi.fn((rounds: number) => `salt-${rounds}`),
  hash: vi.fn((password: string, salt: string) => `${password}.${salt}`),
  compare: vi.fn(
    (password: string, hash: string) => password === hash.slice(0, hash.lastIndexOf(".")),
  ),
}))

vi.mock("../../src/util/fetchRemoteConfig", () => ({
  fetchRemoteConfig: vi.fn(() =>
    Promise.resolve({
      featureFlags: {
        BUY_CRYPTO: true, // nav buttons + button in fund wallet component
        LINK_STAKING: true,
      },
    }),
  ),
}))

// the polyfill hands back the `browser` global from tests/setup.ts
vi.mock("webextension-polyfill", async (importOriginal) => {
  const { default: browser } = await importOriginal<{ default: Browser }>()
  const mocked = {
    ...browser,
    runtime: {
      ...browser.runtime,
      getBackgroundPage: vi.fn(() => Promise.resolve({ location: window.location } as Window)),
    },
  }
  return { ...mocked, default: mocked }
})

vi.mock("@polkadot/apps-config/api", () => {
  return {
    typesBundle: {},
  }
})

vi.mock("../../src/util/isBackgroundPage", () => ({
  isBackgroundPage: vi.fn().mockImplementation(() => true),
}))

export {}
