import type { KeyringPair } from "@polkadot/keyring/types"
import type { HexString } from "@polkadot/util/types"
import type { SignerPayloadJSON } from "@substrate/txwrapper-core"
import { Keyring } from "@polkadot/keyring"
import { blake2AsU8a, cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto"
import { Err, Ok } from "ts-results"

import type { TestEventRecord } from "../../../../tests/bittensor"
import type { MessageTypes, RequestTypes, ResponseTypes } from "../../../types"
import type { Port } from "../../../types/base"
import type { WalletTransactionInfo } from "../../transactions"
import {
  ALICE,
  BOB,
  createBittensorRegistry,
  dispatchErrors,
  encodeEvents,
  events,
  EVENTS_KEY,
  GENESIS_HASH,
} from "../../../../tests/bittensor"
import { chainConnector } from "../../../rpcs/chain-connector"
import { chaindataProvider } from "../../../rpcs/chaindata"
import { getTypeRegistry } from "../../../util/getTypeRegistry"
import { keyringStore } from "../../keyring/store"
import { withPjsKeyringPair } from "../../keyring/withPjsKeyringPair"
import { getExtrinsicHash } from "../../transactions"
import { SubHandler } from "../handler.extension"

// ---------------------------------------------------------------------------------------------
// The service worker around the handler: chain RPC, chaindata, the type registry and the keyring
// are mocked. The transaction watcher (`watchSubstrateTransaction`) and the History helpers are
// the real ones, over an in-memory `db.transactionsV2`.
// ---------------------------------------------------------------------------------------------

jest.mock("../../../libs/Handler", () => ({
  ExtensionHandler: class {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_stores: unknown) {}
  },
}))
jest.mock("../../../rpcs/chain-connector", () => ({
  chainConnector: { send: jest.fn(), subscribe: jest.fn() },
}))
jest.mock("../../../rpcs/chaindata", () => ({
  chaindataProvider: { getNetworkByGenesisHash: jest.fn() },
}))
jest.mock("../../../util/getTypeRegistry", () => ({ getTypeRegistry: jest.fn() }))
jest.mock("../../../util/getMetadataDef", () => ({ getMetadataDef: jest.fn() }))
jest.mock("../../keyring/store", () => ({ keyringStore: { getAccount: jest.fn() } }))
jest.mock("../../keyring/withPjsKeyringPair", () => ({ withPjsKeyringPair: jest.fn() }))
jest.mock("../../../config/sentry", () => ({ sentry: { captureException: jest.fn() } }))
jest.mock("../../../notifications", () => ({ createNotification: jest.fn() }))
jest.mock("../../app/store.settings", () => ({
  settingsStore: { get: jest.fn(async () => false) },
}))
jest.mock("../../../db", () => {
  type Row = Record<string, unknown> & { id: string }
  const rows = new Map<string, Row>()
  const collection = (items: Row[]) => ({
    filter: (fn: (row: Row) => boolean) => collection(items.filter(fn)),
    modify: async (changes: Partial<Row>) => {
      for (const row of items) rows.set(row.id, { ...row, ...changes })
    },
  })
  return {
    db: {
      transactionsV2: {
        rows,
        add: async (row: Row) => {
          if (rows.has(row.id)) throw new Error(`${row.id} exists`)
          rows.set(row.id, row)
        },
        get: async (id: string) => rows.get(id),
        update: async (id: string, changes: Partial<Row>) => {
          const row = rows.get(id)
          if (!row) return 0
          rows.set(id, { ...row, ...changes })
          return 1
        },
        delete: async (id: string) => {
          rows.delete(id)
        },
        filter: (fn: (row: Row) => boolean) => collection([...rows.values()].filter(fn)),
      },
    },
  }
})

const history = (
  jest.requireMock("../../../db") as {
    db: { transactionsV2: { rows: Map<string, Record<string, unknown>> } }
  }
).db.transactionsV2.rows

const send = chainConnector.send as jest.Mock
const subscribe = chainConnector.subscribe as jest.Mock
const getAccount = keyringStore.getAccount as jest.Mock
const withPair = withPjsKeyringPair as jest.Mock

// ---------------------------------------------------------------------------------------------

const { registry, tx } = createBittensorRegistry()

const CHAIN = {
  id: "bittensor",
  name: "Bittensor",
  genesisHash: GENESIS_HASH,
  blockExplorerUrls: [] as string[],
  rpcs: [],
}

const TX_INFO: WalletTransactionInfo = {
  type: "transfer",
  tokenId: "bittensor:substrate-native",
  value: "1000000000",
  to: BOB,
}

const METHOD = tx.utility.batchAll([tx.balances.transferKeepAlive(BOB, 1_000_000_000n)]).toHex()

const payload = (): SignerPayloadJSON => ({
  address: ALICE,
  blockHash: `0x${"11".repeat(32)}`,
  blockNumber: "0x003d0900",
  era: registry.createType("ExtrinsicEra", { current: 4_000_000, period: 64 }).toHex(),
  genesisHash: GENESIS_HASH,
  method: METHOD,
  nonce: "0x00000007",
  signedExtensions: registry.signedExtensions,
  specVersion: "0x00000169",
  tip: "0x00000000000000000000000000000000",
  transactionVersion: "0x00000001",
  version: 4,
})

/** The block the batch lands in: an inherent at index 0, the batch at index 1. */
const HEADER = {
  parentHash: `0x${"22".repeat(32)}`,
  number: "0x3d0901",
  stateRoot: `0x${"33".repeat(32)}`,
  extrinsicsRoot: `0x${"44".repeat(32)}`,
  digest: { logs: [] },
}
const HEADER_HASH = registry.createType("Header", HEADER).hash.toHex()
const INHERENT = registry
  .createType("Extrinsic", { method: tx.timestamp.set(1_700_000_000_000).toHex() }, { version: 4 })
  .toHex()

const SETTLER = "0x5c1d1d6e8b9b7a3e0d4c2f6a8b0e3d5c7a9f1b2d" as const
const OPEN_TOPIC = `0x${"a1".repeat(32)}` as const
const ORDER_ID = `0x${"0d".repeat(32)}` as const

/** `System.Events` of that block: the inherent's, then the batch's. */
const blockEvents = (batch: TestEventRecord["event"][]) =>
  encodeEvents([
    { phase: 0, event: events.success() },
    ...batch.map((event) => ({ phase: 1, event })),
    { phase: "Finalization", event: events.withdraw(BOB, 1n) },
  ])

let pair: KeyringPair
let chain: {
  /** What was broadcast (`author_submitExtrinsic`), in order. */
  submitted: HexString[]
  /** `System.Events` of the block. */
  eventsHex: string
  /** Set to make `author_submitExtrinsic` fail. */
  submitError?: Error
  /** The watcher's head subscriptions, by subscribe method. */
  heads: Record<string, (error: unknown, data: unknown) => Promise<void>>
  unsubscribed: string[]
}

/** Let pending promises run (the mocks answer on the microtask queue; timers are fake). */
const flush = async (ticks = 50) => {
  for (let i = 0; i < ticks; i++) await Promise.resolve()
}
const waitFor = async (predicate: () => unknown) => {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return
    await flush()
  }
  throw new Error("waitFor: timed out")
}

/** A new head arrives on `subscription`: the watcher looks for the batch in that block. */
const newHead = async (
  subscription: "chain_subscribeAllHeads" | "chain_subscribeFinalizedHeads",
) => {
  await chain.heads[subscription](null, HEADER)
  await flush()
}

const handler = new SubHandler({} as never)
const call = <M extends MessageTypes>(type: M, request: RequestTypes[M]) =>
  handler.handle("1", type, request, {} as Port) as Promise<ResponseTypes[M]>

beforeAll(async () => {
  await cryptoWaitReady()
  pair = new Keyring({ type: "sr25519" }).addFromUri("//Alice") // public dev account
})

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  history.clear()
  chain = { submitted: [], eventsHex: blockEvents([events.success()]), heads: {}, unsubscribed: [] }
  ;(chaindataProvider.getNetworkByGenesisHash as jest.Mock).mockResolvedValue(CHAIN)
  ;(getTypeRegistry as jest.Mock).mockResolvedValue({ registry })
  getAccount.mockResolvedValue({ type: "keypair", address: ALICE, curve: "sr25519", name: "A" })
  withPair.mockImplementation(async (_address: string, cb: (p: KeyringPair) => unknown) =>
    Ok(await cb(pair)),
  )

  send.mockImplementation(async (_chainId: string, method: string, params: unknown[]) => {
    switch (method) {
      case "author_submitExtrinsic": {
        if (chain.submitError) throw chain.submitError
        const hex = params[0] as HexString
        chain.submitted.push(hex)
        return registry.createType("Extrinsic", hex).hash.toHex()
      }
      case "chain_getBlock":
        return {
          block: { header: HEADER, extrinsics: [INHERENT, ...chain.submitted] },
          justifications: null,
        }
      case "state_queryStorageAt":
        return [{ block: HEADER_HASH, changes: [[EVENTS_KEY, chain.eventsHex]] }]
    }
    throw new Error(`unexpected RPC ${method}`)
  })
  subscribe.mockImplementation(
    async (
      _chainId: string,
      method: string,
      _responseMethod: string,
      _params: unknown[],
      callback: (error: unknown, data: unknown) => Promise<void>,
    ) => {
      chain.heads[method] = callback
      return (unsubscribeMethod: string) => chain.unsubscribed.push(unsubscribeMethod)
    },
  )
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

const sign = (p: SignerPayloadJSON) => call("pri(substrate.rpc.sign)", { payload: p })

/** What a signature over `p` signs: the payload's bytes, hashed when longer than 256. */
const signedBytes = (p: SignerPayloadJSON) => {
  const bytes = registry.createType("ExtrinsicPayload", p, { version: 4 }).toU8a({ method: true })
  return bytes.length > 256 ? blake2AsU8a(bytes) : bytes
}

/** A broadcast extrinsic: signed by Alice over `p`, with this hash. */
const expectBroadcast = (hex: HexString, p: SignerPayloadJSON, hash: HexString) => {
  const extrinsic = registry.createType("Extrinsic", hex)
  expect(extrinsic.isSigned).toBe(true)
  expect(extrinsic.signer.toString()).toBe(ALICE)
  expect(extrinsic.method.toHex()).toBe(p.method)
  expect(extrinsic.hash.toHex()).toBe(hash)
  // `signature` is the sr25519 signature without the MultiSignature prefix
  expect(signatureVerify(signedBytes(p), extrinsic.signature.toU8a(), ALICE).isValid).toBe(true)
  return extrinsic
}

const submittedRpcs = () =>
  send.mock.calls.filter(([, method]) => method === "author_submitExtrinsic")

// ---------------------------------------------------------------------------------------------

describe("pri(substrate.rpc.sign)", () => {
  it("signs a local keypair account's payload and returns the extrinsic's hash, broadcasting nothing", async () => {
    const p = payload()
    const { signature, extrinsicHash } = await sign(p)

    // a MultiSignature (sr25519) over the payload, as `submit` would have made it
    expect(signature).toMatch(/^0x01[0-9a-f]{128}$/)
    expect(signatureVerify(signedBytes(p), signature, ALICE).isValid).toBe(true)
    expect(extrinsicHash).toBe(getExtrinsicHash(registry, p, signature))

    expect(withPair).toHaveBeenCalledWith(ALICE, expect.any(Function))
    expect(send).not.toHaveBeenCalled()
    expect(subscribe).not.toHaveBeenCalled()
    expect(history.size).toBe(0)
  })

  it("signs with chaindata's signature type override when there is one, like submit (LAOS workaround)", async () => {
    ;(chaindataProvider.getNetworkByGenesisHash as jest.Mock).mockResolvedValue({
      ...CHAIN,
      hasExtrinsicSignatureTypePrefix: true,
    })
    const p = payload()
    const { signature, extrinsicHash } = await sign(p)
    expect(signature).toMatch(/^0x01[0-9a-f]{128}$/)
    expect(signatureVerify(signedBytes(p), signature, ALICE).isValid).toBe(true)
    expect(extrinsicHash).toBe(getExtrinsicHash(registry, p, signature))
  })

  it.each(["ledger-polkadot", "polkadot-vault", "watch-only", "signet", "contact"])(
    "refuses a %s account without touching the keyring or the chain",
    async (type) => {
      getAccount.mockResolvedValue({ type, address: ALICE, name: "A" })
      await expect(sign(payload())).rejects.toThrow(
        `Can't sign: only an account whose key is in this wallet (keypair) can sign here, and ${ALICE} is a ${type} account`,
      )
      expect(withPair).not.toHaveBeenCalled()
      expect(send).not.toHaveBeenCalled()
    },
  )

  it("refuses an account that isn't in the wallet", async () => {
    getAccount.mockResolvedValue(null)
    await expect(sign(payload())).rejects.toThrow(
      `Can't sign: account ${ALICE} is not in this wallet`,
    )
    expect(withPair).not.toHaveBeenCalled()
  })

  it("says why the keyring couldn't sign (locked wallet, failure)", async () => {
    withPair.mockResolvedValueOnce(Err("Unauthorised"))
    await expect(sign(payload())).rejects.toThrow("Can't sign: Unauthorised")

    withPair.mockResolvedValueOnce(Err(new Error("bad key")))
    await expect(sign(payload())).rejects.toThrow("Can't sign: bad key")
    expect(send).not.toHaveBeenCalled()
  })
})

describe("pri(substrate.rpc.submitAndWatch)", () => {
  const submitAndWatch = async (txInfo?: WalletTransactionInfo) => {
    const p = payload()
    const { signature, extrinsicHash } = await sign(p)
    const result = call("pri(substrate.rpc.submitAndWatch)", { payload: p, signature, txInfo })
    // seen whatever happens, so a rejection is never unhandled
    const settled = result.then(
      (value) => ({ value }),
      (error: Error) => ({ error }),
    )
    return { p, signature, extrinsicHash, result, settled }
  }

  it("broadcasts, adds the History entry, and resolves with the block and the batch's own events", async () => {
    const { p, signature, extrinsicHash, result } = await submitAndWatch(TX_INFO)

    await waitFor(() => chain.submitted.length)
    // broadcast exactly as `submit` builds it, with the signature `sign` gave
    const broadcast = expectBroadcast(chain.submitted[0], p, extrinsicHash)
    expect(`0x01${broadcast.signature.toHex().slice(2)}`).toBe(signature)

    // the History entry, as for `submit`
    expect(history.get(extrinsicHash)).toMatchObject({
      hash: extrinsicHash,
      account: ALICE,
      networkId: "bittensor",
      status: "pending",
      txInfo: TX_INFO,
    })

    chain.eventsHex = blockEvents([
      events.withdraw(ALICE, 1_000n),
      events.evmLog(SETTLER, [OPEN_TOPIC, ORDER_ID], "0x"),
      events.success(),
    ])
    await newHead("chain_subscribeAllHeads")

    const response = await result
    expect(response).toEqual({
      blockHash: HEADER_HASH,
      events: [
        { section: "balances", method: "Withdraw", data: [ALICE, 1000] },
        {
          section: "evm",
          method: "Log",
          data: [{ address: SETTLER, topics: [OPEN_TOPIC, ORDER_ID], data: "0x" }],
        },
        {
          section: "system",
          method: "ExtrinsicSuccess",
          data: [{ weight: { refTime: 1, proofSize: 2 }, class: "Normal", paysFee: "Yes" }],
        },
      ],
      ok: true,
    })
    // the watch goes on as before: in a block is success, not yet confirmed
    await waitFor(() => history.get(extrinsicHash)?.status === "success")
    expect(history.get(extrinsicHash)).toMatchObject({
      status: "success",
      confirmed: false,
      blockNumber: "4000001",
    })

    // and finalization confirms it, without resolving anything twice
    await newHead("chain_subscribeFinalizedHeads")
    await waitFor(() => history.get(extrinsicHash)?.confirmed)
  })

  it("resolves with ok: false and the dispatch error when the batch failed on chain", async () => {
    const { extrinsicHash, result } = await submitAndWatch()
    await waitFor(() => chain.submitted.length)

    chain.eventsHex = blockEvents([events.failed(dispatchErrors.token("FundsUnavailable"))])
    await newHead("chain_subscribeAllHeads")

    await expect(result).resolves.toMatchObject({
      blockHash: HEADER_HASH,
      ok: false,
      error: "token.FundsUnavailable",
      events: [expect.objectContaining({ section: "system", method: "ExtrinsicFailed" })],
    })
    await waitFor(() => history.get(extrinsicHash)?.status === "error")
  })

  it("resolves from a finalized head too, when that is where the batch is first seen", async () => {
    const { result } = await submitAndWatch()
    await waitFor(() => chain.submitted.length)

    await newHead("chain_subscribeFinalizedHeads")
    await expect(result).resolves.toMatchObject({ blockHash: HEADER_HASH, ok: true })
  })

  it("rejects, and drops the History entry, when the node refuses the extrinsic", async () => {
    chain.submitError = new Error("1010: Invalid Transaction: Inability to pay some fees")
    const { extrinsicHash, settled } = await submitAndWatch(TX_INFO)

    const { error } = (await settled) as { error: Error }
    expect(error.message).toBe(
      `Couldn't submit extrinsic ${extrinsicHash}: 1010: Invalid Transaction: Inability to pay some fees`,
    )
    expect(error.cause).toBe(chain.submitError)
    await waitFor(() => !history.has(extrinsicHash))
  })

  it("rejects when the batch isn't seen in a block within the watch's 90 s", async () => {
    const { extrinsicHash, settled } = await submitAndWatch(TX_INFO)
    await waitFor(() => chain.submitted.length)

    await jest.advanceTimersByTimeAsync(89_999)
    await flush()
    expect(await Promise.race([settled, Promise.resolve("pending")])).toBe("pending")

    await jest.advanceTimersByTimeAsync(1)
    const { error } = (await settled) as { error: Error }
    expect(error.message).toBe(
      `Extrinsic ${extrinsicHash} was submitted but not seen in a block within 90 seconds. It may still be included: check the account's history before trying again.`,
    )
    // the History entry stays, marked unknown, as for any watch that times out
    await waitFor(() => history.get(extrinsicHash)?.status === "unknown")
    expect(chain.unsubscribed.sort()).toEqual([
      "chain_subscribeAllHeads",
      "chain_subscribeFinalizedHeads",
    ])
  })

  it("submits nothing when the extrinsic can't be watched", async () => {
    subscribe.mockRejectedValue(new Error("no connection"))
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
    try {
      const { extrinsicHash, settled } = await submitAndWatch(TX_INFO)
      const { error } = (await settled) as { error: Error }
      expect(error.message).toBe(
        `Couldn't watch extrinsic ${extrinsicHash}, so it was not submitted`,
      )
      expect(submittedRpcs()).toHaveLength(0)
      expect(history.has(extrinsicHash)).toBe(false)
    } finally {
      warn.mockRestore()
    }
  })
})

describe("pri(substrate.rpc.submit), unchanged", () => {
  it("signs with the keypair, adds the History entry, broadcasts and returns the hash at once", async () => {
    const p = payload()
    const { hash } = await call("pri(substrate.rpc.submit)", { payload: p, txInfo: TX_INFO })

    expect(withPair).toHaveBeenCalledTimes(1)
    expect(chain.submitted).toHaveLength(1)
    expectBroadcast(chain.submitted[0], p, hash)
    // returned before any block was seen
    expect(subscribe).toHaveBeenCalledTimes(2)
    expect(history.get(hash)).toMatchObject({ status: "pending", txInfo: TX_INFO })

    // the watch then follows it as before
    await newHead("chain_subscribeAllHeads")
    await waitFor(() => history.get(hash)?.status === "success")
    await newHead("chain_subscribeFinalizedHeads")
    await waitFor(() => history.get(hash)?.confirmed)
  })

  it("broadcasts a signature made elsewhere (hardware) without the keyring", async () => {
    const p = payload()
    const { signature } = await sign(p)
    withPair.mockClear()

    const { hash } = await call("pri(substrate.rpc.submit)", { payload: p, signature })
    expect(withPair).not.toHaveBeenCalled()
    const broadcast = expectBroadcast(chain.submitted[0], p, hash)
    expect(`0x01${broadcast.signature.toHex().slice(2)}`).toBe(signature)
    expect(hash).toBe(getExtrinsicHash(registry, p, signature))
  })

  it("rethrows the node's error as is and drops the History entry", async () => {
    chain.submitError = new Error("1010: Invalid Transaction")
    const p = payload()
    const { signature, extrinsicHash } = await sign(p)
    await expect(
      call("pri(substrate.rpc.submit)", { payload: p, signature, txInfo: TX_INFO }),
    ).rejects.toBe(chain.submitError)
    await waitFor(() => !history.has(extrinsicHash))
  })

  it("marks the entry unknown when no block is seen within 90 s", async () => {
    const { hash } = await call("pri(substrate.rpc.submit)", { payload: payload() })
    await jest.advanceTimersByTimeAsync(90_000)
    await waitFor(() => history.get(hash)?.status === "unknown")
  })
})
