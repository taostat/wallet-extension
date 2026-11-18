import {
  DEFAULT_CHAINS,
  DEFAULT_QUOTER_URL,
  ETHEREUM,
  KNOWN_SETTLERS,
  SUBTENSOR_EVM,
  TYPEHASH_16AE,
  TYPEHASH_9737,
} from "@tao.com/intents-sdk"
import { mainnet } from "viem/chains"

import type { CrossChainConfig } from "../config"
import { DEFAULT_CROSS_CHAIN_CONFIG } from "../config"
import {
  createEvmPublicClients,
  createTaoIntents,
  EVM_RPC_TIMEOUT_MS,
  FILL_WINDOW_SECONDS,
  orderWatchOptions,
} from "../intents-client"
import { mockJsonRpcFetch } from "./rpc-mock"

/** Not the built-in defaults, so the tests show the config's URLs are the ones used. */
const ETHEREUM_RPC = "https://eth.rpc.example"
const BITTENSOR_RPC = "https://bittensor.rpc.example"
const CONFIG: CrossChainConfig = {
  enabled: true,
  evmRpcUrls: { ethereum: ETHEREUM_RPC, bittensor: BITTENSOR_RPC },
  orderPollIntervalMs: 12_000,
}

/** The public endpoints the SDK and viem would otherwise use, and our old proxy's path. */
const DEFAULT_RPC_HOSTS = [
  new URL(DEFAULT_CHAINS[SUBTENSOR_EVM].rpcUrl!).host, // lite.chain.opentensor.ai
  ...mainnet.rpcUrls.default.http.map((url) => new URL(url).host), // eth.merkle.io
]
const FORBIDDEN = [...DEFAULT_RPC_HOSTS, "/evm-rpc"]

const containsForbidden = (value: unknown) => {
  const text = JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v))
  return FORBIDDEN.filter((needle) => text.includes(needle))
}

describe("createEvmPublicClients", () => {
  it("uses exactly the config's URLs, in the transports and in the chains", () => {
    const clients = createEvmPublicClients(CONFIG.evmRpcUrls)

    expect(clients[ETHEREUM].chain?.id).toBe(1)
    expect(clients[SUBTENSOR_EVM].chain?.id).toBe(964)
    expect(clients[ETHEREUM].transport.url).toBe(ETHEREUM_RPC)
    expect(clients[SUBTENSOR_EVM].transport.url).toBe(BITTENSOR_RPC)
    expect(clients[ETHEREUM].chain?.rpcUrls).toEqual({ default: { http: [ETHEREUM_RPC] } })
    expect(clients[SUBTENSOR_EVM].chain?.rpcUrls).toEqual({ default: { http: [BITTENSOR_RPC] } })
    expect(containsForbidden(clients[ETHEREUM].chain)).toEqual([])
    expect(containsForbidden(clients[SUBTENSOR_EVM].chain)).toEqual([])
  })

  it("uses viem's normal 10 s timeout and no batching", () => {
    expect(EVM_RPC_TIMEOUT_MS).toBe(10_000)
    const clients = createEvmPublicClients(CONFIG.evmRpcUrls)
    for (const client of [clients[ETHEREUM], clients[SUBTENSOR_EVM]]) {
      expect(client.transport.timeout).toBe(EVM_RPC_TIMEOUT_MS)
      expect(client.batch?.multicall).toBeFalsy()
    }
  })

  it("reads the keyless Blockmachine endpoints by default", () => {
    const clients = createEvmPublicClients(DEFAULT_CROSS_CHAIN_CONFIG.evmRpcUrls)
    expect(clients[ETHEREUM].transport.url).toBe("https://rpc-eth.blockmachine.io")
    expect(clients[SUBTENSOR_EVM].transport.url).toBe("https://rpc.blockmachine.io")
  })

  it("refuses a hand-built config whose URLs the config check would refuse", () => {
    const urls = (ethereum: string, bittensor = BITTENSOR_RPC) => ({ ethereum, bittensor })
    expect(() => createEvmPublicClients(urls("http://eth.rpc.example"))).toThrow(
      /chain 1 is unusable: http: is only allowed to localhost/,
    )
    expect(() => createEvmPublicClients(urls(ETHEREUM_RPC, ""))).toThrow(
      /chain 964 is unusable: not a URL/,
    )
    expect(() => createEvmPublicClients(urls("wss://eth.rpc.example"))).toThrow(/must be https/)
    expect(() =>
      createEvmPublicClients({ ethereum: ETHEREUM_RPC } as CrossChainConfig["evmRpcUrls"]),
    ).toThrow(/chain 964 is unusable: missing/)
    expect(() => createEvmPublicClients(urls("http://localhost:8545"))).not.toThrow()
  })
})

describe("createTaoIntents", () => {
  it("leaves no public default RPC, or the old proxy, in the SDK's chain configs", () => {
    expect(DEFAULT_RPC_HOSTS).toEqual(["lite.chain.opentensor.ai", "eth.merkle.io"])
    const chains = createTaoIntents({ config: CONFIG }).getChains()

    expect(chains.map((c) => [c.id, c.rpcUrl])).toEqual([
      [ETHEREUM, ETHEREUM_RPC],
      [SUBTENSOR_EVM, BITTENSOR_RPC],
    ])
    expect(containsForbidden(chains)).toEqual([])
  })

  it("defaults the fill window to the website's 300 s and validates an override", () => {
    expect(FILL_WINDOW_SECONDS).toBe(300)
    expect(() => createTaoIntents({ config: CONFIG, fillWindowSeconds: 30 })).toThrow(
      /fillWindowSeconds/,
    )
    expect(() => createTaoIntents({ config: CONFIG, fillWindowSeconds: 600 })).not.toThrow()
  })

  it("sends the SDK's own reads, on both chains, to the config's URLs only", async () => {
    const filled = `0x${"00".repeat(31)}01`
    // The contract each chain runs, as the Quoter names it (`approvalSpender`). Bittensor's is the
    // 16AE one, not the SDK's built-in default, so the reads below show the lookup is followed.
    const live: Record<number, string | undefined> = {
      [SUBTENSOR_EVM]: KNOWN_SETTLERS[TYPEHASH_16AE][SUBTENSOR_EVM]?.[0],
      [ETHEREUM]: KNOWN_SETTLERS[TYPEHASH_9737][ETHEREUM]?.[0],
    }
    const lookups: string[] = []
    const readContracts: string[] = []
    const rpc = mockJsonRpcFetch(
      (method, params) => {
        if (method !== "eth_call") return undefined
        readContracts.push((params[0] as { to: string }).to.toLowerCase())
        return filled
      },
      {
        urls: [ETHEREUM_RPC, BITTENSOR_RPC],
        // The SDK's settler lookup: an indicative quote out of the chain, whose spender is its contract.
        quoter: {
          url: DEFAULT_QUOTER_URL,
          answer: ({ originChainId }) => {
            lookups.push(String(originChainId))
            return {
              quote: { validUntil: 4_000_000_000, preview: { outputs: [{ amount: "100000000" }] } },
              approvalSpender: live[Number(originChainId)],
            }
          },
        },
      },
    )
    try {
      const intents = createTaoIntents({ config: CONFIG })
      // One read on the origin chain and one on the destination.
      const order = intents.getOrder({
        orderId: `0x${"0d".repeat(32)}`,
        originChainId: SUBTENSOR_EVM,
        destinationChainId: ETHEREUM,
        fillDeadline: 4_000_000_000,
      })

      await expect(order.getStatus()).resolves.toMatchObject({ state: "filled" })

      const chainReads = rpc.requests.filter((r) => r.method !== "quote")
      expect(chainReads.map((r) => r.url).sort()).toEqual([BITTENSOR_RPC, ETHEREUM_RPC])
      // The settler lookup stays on: one Quoter call per chain, answered the first time, and the
      // order is read on the contracts it named.
      expect(lookups.sort()).toEqual([String(ETHEREUM), String(SUBTENSOR_EVM)])
      expect(rpc.requests.filter((r) => r.method === "quote").map((r) => r.url)).toEqual([
        DEFAULT_QUOTER_URL,
        DEFAULT_QUOTER_URL,
      ])
      expect(readContracts.sort()).toEqual(
        [live[ETHEREUM], live[SUBTENSOR_EVM]].map((address) => address?.toLowerCase()).sort(),
      )
      expect(containsForbidden(rpc.requests)).toEqual([])
    } finally {
      rpc.restore()
    }
  })
})

describe("orderWatchOptions", () => {
  it("polls orders at the config's interval", () => {
    expect(orderWatchOptions(CONFIG)).toEqual({ pollIntervalMs: 12_000 })
    expect(orderWatchOptions(DEFAULT_CROSS_CHAIN_CONFIG)).toEqual({ pollIntervalMs: 10_000 })
  })
})
