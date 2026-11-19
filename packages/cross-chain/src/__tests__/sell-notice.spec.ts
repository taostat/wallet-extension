import { describe, expect, it } from "vitest"

import { sellNoticeUrl } from "../sell-notice"

const DASHBOARD = "chrome-extension://abcdefghijklmnopabcdefghijklmnop/dashboard.html"
const TX =
  "https://taostats.io/extrinsic/0x9e31abb5489888d2059fb33ae2e8d081e433b05e701d3e38f5629ad4c395195d"
const ID = "0x9e31abb5489888d2059fb33ae2e8d081e433b05e701d3e38f5629ad4c395195d"

describe("sellNoticeUrl", () => {
  it("opens a delivered sell's transaction, as Recent swaps' View the transaction does", () => {
    expect(
      sellNoticeUrl({
        kind: "delivered",
        recordId: ID,
        transactionUrl: TX,
        dashboardUrl: DASHBOARD,
      }),
    ).toBe(TX)
  })

  it("opens the dashboard portfolio for a sell that needs attention, one per sell", () => {
    const url = sellNoticeUrl({
      kind: "attention",
      recordId: ID,
      transactionUrl: TX,
      dashboardUrl: DASHBOARD,
    })
    // The query is before the `#`: the dashboard routes on the hash.
    expect(url).toBe(`${DASHBOARD}?crossChainSell=${ID}#/portfolio`)
    expect(
      sellNoticeUrl({ kind: "attention", recordId: "0xother", dashboardUrl: DASHBOARD }),
    ).not.toBe(url)
  })

  it("falls back to the dashboard when a delivered sell has no transaction URL", () => {
    for (const transactionUrl of [undefined, null, ""])
      expect(
        sellNoticeUrl({ kind: "delivered", recordId: ID, transactionUrl, dashboardUrl: DASHBOARD }),
      ).toBe(`${DASHBOARD}?crossChainSell=${ID}#/portfolio`)
  })

  it("escapes an id that isn't a plain hash", () => {
    const url = sellNoticeUrl({
      kind: "attention",
      recordId: "stranded:a b&c",
      dashboardUrl: DASHBOARD,
    })
    expect(new URL(url).searchParams.get("crossChainSell")).toBe("stranded:a b&c")
    expect(new URL(url).hash).toBe("#/portfolio")
  })

  it("is a URL the service worker's click handler opens", () => {
    for (const kind of ["delivered", "attention"] as const)
      expect(
        () =>
          new URL(
            sellNoticeUrl({ kind, recordId: ID, transactionUrl: TX, dashboardUrl: DASHBOARD }),
          ),
      ).not.toThrow()
  })
})
