import {
  CROSS_CHAIN_CONFIG_TIMEOUT_MS,
  DEFAULT_CROSS_CHAIN_CONFIG,
  fetchCrossChainConfig,
  parseCrossChainConfig,
} from "../config"

const API = "https://taostats.io/api/wallet-extension"
const CONFIG_URL = `${API}/cross-chain/config`

/** Differs from the defaults in every field, so a server answer is told apart from a fallback. */
const BODY = {
  enabled: false,
  evmRpcUrls: { ethereum: "https://eth.rpc.example", bittensor: "https://bittensor.rpc.example" },
  orderPollIntervalMs: 15_000,
}

type FetchMock = jest.Mock<Promise<Response>, Parameters<typeof fetch>>

const mockFetch = (impl: (...args: Parameters<typeof fetch>) => Promise<Response>): FetchMock =>
  jest.fn(impl)

const answering = (body: unknown, status = 200) =>
  mockFetch(
    async () =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  )

/** Never answers, and ignores the abort signal. */
const hanging = () => mockFetch(() => new Promise<Response>(() => {}))

const withUrls = (urls: Record<string, unknown>) => ({
  ...BODY,
  evmRpcUrls: { ...BODY.evmRpcUrls, ...urls },
})

const fallback = (problem: RegExp) => ({
  config: DEFAULT_CROSS_CHAIN_CONFIG,
  source: "default",
  problem: expect.stringMatching(problem),
})

describe("DEFAULT_CROSS_CHAIN_CONFIG", () => {
  it("reads keyless Blockmachine, is enabled and polls orders every 10 s", () => {
    expect(DEFAULT_CROSS_CHAIN_CONFIG).toEqual({
      enabled: true,
      evmRpcUrls: {
        ethereum: "https://rpc-eth.blockmachine.io",
        bittensor: "https://rpc.blockmachine.io",
      },
      orderPollIntervalMs: 10_000,
    })
    expect(parseCrossChainConfig(DEFAULT_CROSS_CHAIN_CONFIG)).toEqual({
      ok: true,
      config: DEFAULT_CROSS_CHAIN_CONFIG,
    })
  })

  it("can't be changed by whoever is handed it", () => {
    expect(Object.isFrozen(DEFAULT_CROSS_CHAIN_CONFIG)).toBe(true)
    expect(Object.isFrozen(DEFAULT_CROSS_CHAIN_CONFIG.evmRpcUrls)).toBe(true)
  })
})

describe("parseCrossChainConfig", () => {
  it("accepts a valid body", () => {
    expect(parseCrossChainConfig(BODY)).toEqual({ ok: true, config: BODY })
  })

  it("drops unknown fields, at the top and inside evmRpcUrls", () => {
    const body = {
      ...BODY,
      evmRpcUrls: { ...BODY.evmRpcUrls, base: "https://base.rpc.example" },
      quoterUrl: "https://quoter.example",
    }
    expect(parseCrossChainConfig(body)).toEqual({ ok: true, config: BODY })
  })

  it.each([
    "http://localhost:8545",
    "http://127.0.0.1:9944",
    "http://LOCALHOST/rpc",
    "https://rpc.example:8443/path",
  ])("accepts %s as an RPC URL", (url) => {
    expect(parseCrossChainConfig(withUrls({ ethereum: url }))).toMatchObject({ ok: true })
  })

  it.each([5_000, 60_000])("accepts an order poll interval of %d ms", (interval) => {
    expect(parseCrossChainConfig({ ...BODY, orderPollIntervalMs: interval })).toMatchObject({
      ok: true,
    })
  })

  it.each<[string, unknown, RegExp]>([
    [
      "http: to a public host",
      withUrls({ ethereum: "http://rpc-eth.blockmachine.io" }),
      /^evmRpcUrls\.ethereum: http: is only allowed to localhost or 127\.0\.0\.1/,
    ],
    [
      "http: to a host that only starts with localhost",
      withUrls({ bittensor: "http://localhost.example.com" }),
      /^evmRpcUrls\.bittensor: http: is only allowed/,
    ],
    ["a non-http scheme", withUrls({ ethereum: "wss://rpc.example" }), /must be https:, got wss:/],
    ["a relative URL", withUrls({ ethereum: "/evm-rpc/ethereum" }), /ethereum: not a URL/],
    ["an empty URL", withUrls({ bittensor: "" }), /bittensor: not a URL/],
    [
      "credentials in the URL",
      withUrls({ ethereum: "https://user:secret@rpc.example" }),
      /must not carry credentials/,
    ],
    ["a URL that isn't a string", withUrls({ ethereum: 1 }), /^evmRpcUrls\.ethereum: /],
    [
      "a missing chain",
      { ...BODY, evmRpcUrls: { ethereum: BODY.evmRpcUrls.ethereum } },
      /^evmRpcUrls\.bittensor: /,
    ],
    ["no RPC URLs", { enabled: true, orderPollIntervalMs: 10_000 }, /^evmRpcUrls: /],
    ["a poll interval below 5 s", { ...BODY, orderPollIntervalMs: 4_999 }, /^orderPollIntervalMs/],
    [
      "a poll interval above 60 s",
      { ...BODY, orderPollIntervalMs: 60_001 },
      /^orderPollIntervalMs/,
    ],
    [
      "a fractional poll interval",
      { ...BODY, orderPollIntervalMs: 10_000.5 },
      /^orderPollInterval/,
    ],
    ["a poll interval as text", { ...BODY, orderPollIntervalMs: "10000" }, /^orderPollIntervalMs/],
    ["a missing poll interval", { enabled: true, evmRpcUrls: BODY.evmRpcUrls }, /^orderPoll/],
    ["enabled as text", { ...BODY, enabled: "false" }, /^enabled: /],
    ["a missing enabled", { evmRpcUrls: BODY.evmRpcUrls, orderPollIntervalMs: 10_000 }, /^enabled/],
    ["null", null, /expected object/],
    ["an array", [BODY], /expected object/],
  ])("refuses %s", (_name, body, problem) => {
    expect(parseCrossChainConfig(body)).toEqual({
      ok: false,
      problem: expect.stringMatching(problem),
    })
  })
})

describe("fetchCrossChainConfig", () => {
  it("returns our API's config", async () => {
    const fetch = answering(BODY)
    await expect(fetchCrossChainConfig(API, { fetch })).resolves.toEqual({
      config: BODY,
      source: "server",
    })
  })

  it("asks with a simple GET: no headers, no body, no cookies", async () => {
    const fetch = answering(BODY)
    await fetchCrossChainConfig(API, { fetch })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe(CONFIG_URL)
    expect(init).toEqual({ method: "GET", credentials: "omit", signal: expect.any(AbortSignal) })
    expect(Object.keys(init ?? {}).sort()).toEqual(["credentials", "method", "signal"])
  })

  it("builds the URL the same with or without a trailing slash, and allows localhost over http:", async () => {
    const fetch = answering(BODY)
    await fetchCrossChainConfig(`${API}/`, { fetch })
    await fetchCrossChainConfig("http://localhost:3001/api/wallet-extension", { fetch })
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      CONFIG_URL,
      "http://localhost:3001/api/wallet-extension/cross-chain/config",
    ])
  })

  it("ignores fields it doesn't know", async () => {
    const fetch = answering({
      ...BODY,
      maintenanceMessage: "soon",
      evmRpcUrls: withUrls({ x: 1 }).evmRpcUrls,
    })
    await expect(fetchCrossChainConfig(API, { fetch })).resolves.toEqual({
      config: BODY,
      source: "server",
    })
  })

  it("uses the global fetch by default", async () => {
    const spy = jest.spyOn(globalThis, "fetch").mockImplementation(answering(BODY))
    try {
      await expect(fetchCrossChainConfig(API)).resolves.toMatchObject({ source: "server" })
      expect(spy).toHaveBeenCalledWith(CONFIG_URL, expect.objectContaining({ method: "GET" }))
    } finally {
      spy.mockRestore()
    }
  })

  it.each<[string, () => FetchMock, RegExp]>([
    [
      "http: to a public host",
      () =>
        answering({ ...withUrls({ ethereum: "http://rpc-eth.blockmachine.io" }), enabled: true }),
      /^the config is invalid: evmRpcUrls\.ethereum: http: is only allowed/,
    ],
    [
      "a missing chain",
      () =>
        answering({ ...BODY, enabled: true, evmRpcUrls: { ethereum: BODY.evmRpcUrls.ethereum } }),
      /^the config is invalid: evmRpcUrls\.bittensor: /,
    ],
    [
      "an out-of-range poll interval",
      () => answering({ ...BODY, enabled: true, orderPollIntervalMs: 1_000 }),
      /^the config is invalid: orderPollIntervalMs/,
    ],
    ["a body that isn't JSON", () => answering("<html>Bad gateway</html>"), /not JSON/],
    ["an empty body", () => answering(""), /not JSON/],
    ["a 500", () => answering(BODY, 500), /HTTP 500/],
    ["a 404", () => answering({ error: "not found" }, 404), /HTTP 404/],
    [
      "a network error",
      () => mockFetch(async () => Promise.reject(new TypeError("Failed to fetch"))),
      /^the request failed: Failed to fetch/,
    ],
    [
      "a fetch that throws synchronously",
      () =>
        mockFetch(() => {
          throw new Error("boom")
        }),
      /^the request failed: boom/,
    ],
  ])("falls back to the defaults, enabled, on %s", async (_name, makeFetch, problem) => {
    const result = await fetchCrossChainConfig(API, { fetch: makeFetch() })
    expect(result).toEqual(fallback(problem))
    expect(result.config.enabled).toBe(true)
  })

  it.each<[string, Record<string, unknown>]>([
    ["a bad URL", withUrls({ ethereum: "http://rpc-eth.blockmachine.io" })],
    ["a missing chain", { ...BODY, evmRpcUrls: { ethereum: BODY.evmRpcUrls.ethereum } }],
    ["an out-of-range poll interval", { ...BODY, orderPollIntervalMs: 1_000 }],
    ["no other field", { enabled: false }],
  ])("obeys enabled: false in a body with %s: the defaults, switched off", async (_name, body) => {
    const result = await fetchCrossChainConfig(API, { fetch: answering(body) })
    expect(result).toEqual({
      config: { ...DEFAULT_CROSS_CHAIN_CONFIG, enabled: false },
      source: "default",
      problem: expect.stringMatching(/^the config is invalid: /),
    })
  })

  it("falls back to the defaults when the API doesn't answer in time, and aborts the request", async () => {
    const fetch = hanging()
    await expect(fetchCrossChainConfig(API, { fetch, timeoutMs: 20 })).resolves.toEqual(
      fallback(/^no answer within 20 ms/),
    )
    expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true)
  })

  it("times out a body that never finishes too", async () => {
    const stalled = { ok: true, status: 200, json: () => new Promise(() => {}) } as Response
    const fetch = mockFetch(async () => stalled)
    await expect(fetchCrossChainConfig(API, { fetch, timeoutMs: 20 })).resolves.toEqual(
      fallback(/no answer within 20 ms/),
    )
  })

  it("waits 5 s by default", async () => {
    expect(CROSS_CHAIN_CONFIG_TIMEOUT_MS).toBe(5_000)
    jest.useFakeTimers()
    try {
      let settled = false
      const result = fetchCrossChainConfig(API, { fetch: hanging() }).finally(() => {
        settled = true
      })
      await jest.advanceTimersByTimeAsync(4_999)
      expect(settled).toBe(false)
      await jest.advanceTimersByTimeAsync(1)
      await expect(result).resolves.toEqual(fallback(/no answer within 5000 ms/))
    } finally {
      jest.useRealTimers()
    }
  })

  it.each(["", "undefined", "/api/wallet-extension", "http://taostats.io/api/wallet-extension"])(
    "falls back to the defaults without a request for the API base URL %j",
    async (apiBaseUrl) => {
      const fetch = answering(BODY)
      await expect(fetchCrossChainConfig(apiBaseUrl, { fetch })).resolves.toEqual(
        fallback(/^the API base URL is unusable: /),
      )
      expect(fetch).not.toHaveBeenCalled()
    },
  )
})
