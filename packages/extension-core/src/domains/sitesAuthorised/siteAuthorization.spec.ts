import { describe, expect, it, vi } from "vitest"

import type { AuthorizedSite } from "./types"
import { siteHasConnectedAccounts, siteNeedsConnectAuthorization } from "./siteAuthorization"
import sitesAuthorisedStore from "./store"

describe("siteAuthorization", () => {
  const siteWithAccounts: AuthorizedSite = {
    id: "taostats.io",
    origin: "Taostats",
    url: "https://taostats.io",
    addresses: ["5abc"],
  }

  const siteWithoutAccounts: AuthorizedSite = {
    id: "example.com",
    origin: "Example",
    url: "https://example.com",
    addresses: [],
  }

  it("detects when a site already has connected accounts", () => {
    expect(siteHasConnectedAccounts(siteWithAccounts)).toBe(true)
    expect(siteHasConnectedAccounts(siteWithoutAccounts)).toBe(false)
    expect(siteHasConnectedAccounts(undefined)).toBe(false)
  })

  it("requires authorization when the site snapshot has no connected accounts", () => {
    vi.spyOn(sitesAuthorisedStore, "getSiteSnapshot").mockReturnValueOnce(undefined)
    expect(siteNeedsConnectAuthorization("https://taostats.io/stake")).toBe(true)

    vi.spyOn(sitesAuthorisedStore, "getSiteSnapshot").mockReturnValueOnce(siteWithAccounts)
    expect(siteNeedsConnectAuthorization("https://taostats.io/stake")).toBe(false)
  })
})
