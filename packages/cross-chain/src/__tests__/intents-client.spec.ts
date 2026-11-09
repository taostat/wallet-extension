import { DEFAULT_CHAINS, ETHEREUM, SUBTENSOR_EVM } from "@tao.com/intents-sdk"
import { mainnet } from "viem/chains"

import {
  createEvmPublicClients,
  createTaoIntents,
  EVM_RPC_TIMEOUT_MS,
  FILL_WINDOW_SECONDS,
  getEvmRpcUrls,
} from "../intents-client"
import { mockJsonRpcFetch } from "./rpc-mock"

const API = "https://taostats.io/api/wallet-extension"
const ETHEREUM_RPC = `${API}/evm-rpc/ethereum`
const BITTENSOR_RPC = `${API}/evm-rpc/bittensor`

/** The public endpoints the SDK and viem would otherwise use. */
const DEFAULT_RPC_HOSTS = [
  new URL(DEFAULT_CHAINS[SUBTENSOR_EVM].rpcUrl!).host, // lite.chain.opentensor.ai
  ...mainnet.rpcUrls.default.http.map((url) => new URL(url).host), // eth.merkle.io
]

const containsDefaultHost = (value: unknown) => {
  const text = JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v))
  return DEFAULT_RPC_HOSTS.filter((host) => text.includes(host))
}

describe("getEvmRpcUrls", () => {
  it("points both chains at our proxy under the API base URL", () => {
    expect(getEvmRpcUrls(API)).toEqual({ [ETHEREUM]: ETHEREUM_RPC, [SUBTENSOR_EVM]: BITTENSOR_RPC })
    expect(getEvmRpcUrls(`${API}/`)).toEqual(getEvmRpcUrls(API))
    expect(getEvmRpcUrls("http://localhost:3001/api/wallet-extension")[ETHEREUM]).toBe(
      "http://localhost:3001/api/wallet-extension/evm-rpc/ethereum",
    )
  })

  it("refuses a missing or non-http base URL instead of falling back to anything", () => {
    expect(() => getEvmRpcUrls("")).toThrow(/not a URL/)
    expect(() => getEvmRpcUrls("undefined")).toThrow(/not a URL/)
    expect(() => getEvmRpcUrls("/api/wallet-extension")).toThrow(/not a URL/)
    expect(() => getEvmRpcUrls("wss://taostats.io/api")).toThrow(/must be http/)
  })
})

describe("createEvmPublicClients", () => {
  it("uses only our URLs, in the transports and in the chains", () => {
    const clients = createEvmPublicClients(getEvmRpcUrls(API))

    expect(clients[ETHEREUM].chain?.id).toBe(1)
    expect(clients[SUBTENSOR_EVM].chain?.id).toBe(964)
    expect(clients[ETHEREUM].transport.url).toBe(ETHEREUM_RPC)
    expect(clients[SUBTENSOR_EVM].transport.url).toBe(BITTENSOR_RPC)
    expect(clients[ETHEREUM].transport.timeout).toBe(EVM_RPC_TIMEOUT_MS)
    expect(clients[ETHEREUM].chain?.rpcUrls).toEqual({ default: { http: [ETHEREUM_RPC] } })
    expect(clients[SUBTENSOR_EVM].chain?.rpcUrls).toEqual({ default: { http: [BITTENSOR_RPC] } })
    expect(containsDefaultHost(clients[ETHEREUM].chain)).toEqual([])
    expect(containsDefaultHost(clients[SUBTENSOR_EVM].chain)).toEqual([])
  })
})

describe("createTaoIntents", () => {
  it("leaves no public default RPC in the SDK's chain configs", () => {
    expect(DEFAULT_RPC_HOSTS).toEqual(["lite.chain.opentensor.ai", "eth.merkle.io"])
    const intents = createTaoIntents({ apiBaseUrl: API })
    const chains = intents.getChains()

    expect(chains.map((c) => [c.id, c.rpcUrl])).toEqual([
      [ETHEREUM, ETHEREUM_RPC],
      [SUBTENSOR_EVM, BITTENSOR_RPC],
    ])
    expect(containsDefaultHost(chains)).toEqual([])
  })

  it("defaults the fill window to the website's 300 s and validates an override", () => {
    expect(FILL_WINDOW_SECONDS).toBe(300)
    expect(() => createTaoIntents({ apiBaseUrl: API, fillWindowSeconds: 30 })).toThrow(
      /fillWindowSeconds/,
    )
    expect(() => createTaoIntents({ apiBaseUrl: API, fillWindowSeconds: 600 })).not.toThrow()
  })

  it("sends the SDK's own reads, on both chains, to our proxy only", async () => {
    const filled = `0x${"00".repeat(31)}01`
    const rpc = mockJsonRpcFetch((method) => (method === "eth_call" ? filled : undefined))
    try {
      const intents = createTaoIntents({ apiBaseUrl: API })
      // One read on the origin chain and one on the destination.
      const order = intents.getOrder({
        orderId: `0x${"0d".repeat(32)}`,
        originChainId: SUBTENSOR_EVM,
        destinationChainId: ETHEREUM,
        fillDeadline: 4_000_000_000,
      })

      await expect(order.getStatus()).resolves.toMatchObject({ state: "filled" })

      expect(rpc.requests.map((r) => r.url).sort()).toEqual([BITTENSOR_RPC, ETHEREUM_RPC])
      expect(containsDefaultHost(rpc.requests)).toEqual([])
    } finally {
      rpc.restore()
    }
  })
})
