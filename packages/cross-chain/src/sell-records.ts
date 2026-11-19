import type { OrderState } from "@tao.com/intents-sdk"

import { ETH_DECIMALS, formatRawAmount, TAO_DECIMALS, USDC_DECIMALS } from "./amounts"

/**
 * The wallet's record of each cross-chain sell, kept so a sell can be followed, reported and
 * recovered after its modal closes. Ported from the website's `orders-store.ts` and
 * `pending-store.ts`, as one list: a sell from a coldkey always has an extrinsic, so one record per
 * extrinsic covers the opened order, the send whose outcome isn't known yet, and the alpha a batch
 * left at the account's EVM mirror.
 *
 * SDK-free and viem-free (the SDK import is a type): the pages' first load reads it through
 * `@taostats-wallet/cross-chain/config`. Everything in a record is a string, a number or a boolean,
 * so it survives `JSON.stringify` as is. What comes back from storage is checked record by record:
 * a bad or older entry is dropped, never thrown on.
 */

/** The record's shape. Bump it, and `SELL_RECORDS_STORAGE_KEY`, on a breaking change. */
export const SELL_RECORD_VERSION = 1 as const

/** Where the list is stored (the app's `localStorage`). */
export const SELL_RECORDS_STORAGE_KEY = `crossChainSells:v${SELL_RECORD_VERSION}`

/** Records kept, newest first. Over it, the oldest go first, except those that still need the user. */
export const SELL_RECORDS_LIMIT = 50

/**
 * How long after its fill deadline an unfinished order is still followed on any page: its refund
 * usually lands by then. With Recent swaps open, every unfinished order is. The website's
 * `POLL_GRACE_SECONDS`.
 */
export const TRACK_GRACE_SECONDS = 3_600

/** Stored entries looked at, at most: a tampered store can't make a read slow. */
const MAX_STORED_RECORDS_READ = 200

type Hex = `0x${string}`

/** What was sold: TAO, or alpha on one subnet and hotkey (SS58). The sell's `SellInput`. */
export type SellRecordInput = { kind: "tao" } | { kind: "alpha"; netuid: number; hotkey: string }

/** An order's state (the SDK's `OrderState`), for code that can't import the SDK. */
export type SellOrderState = OrderState

/** What is delivered on Ethereum. The sell's `SellOutput`. */
export type SellRecordOutput = "USDC" | "ETH"

/** `order.toJSON()` of a coldkey's order (it has no `openTxHash`). */
export type SellOrderRef = {
  orderId: Hex
  originChainId: number
  destinationChainId: number
  fillDeadline: number
}

/**
 * Where a sell stands:
 *
 * - the order's own state, once it opened (`open`, `awaiting-refund`, `filled`, `refunded`);
 * - `unconfirmed`: sent, but whether it is in a block isn't known yet ("Check again");
 * - `notOpened`: in a block, but the swap didn't open (for alpha, `strandedAlpha` says where it is);
 * - `notIncluded`: never in a block, or rolled back: nothing moved.
 */
export type SellRecordStatus = OrderState | "unconfirmed" | "notOpened" | "notIncluded"

export type CrossChainSellRecord = {
  version: typeof SELL_RECORD_VERSION
  /** The extrinsic hash in lower case; `stranded:…` for alpha left without a known hash. */
  id: string
  /** The sell's extrinsic. */
  extrinsicHash?: Hex
  status: SellRecordStatus
  /** Once the order is known. */
  order?: SellOrderRef
  /** The account that paid (SS58, as the wallet holds it). */
  address: string
  from: SellRecordInput
  to: SellRecordOutput
  /** Dot-decimal amount paid (TAO or alpha). */
  amountIn: string
  /** Dot-decimal amount quoted to arrive, when known. */
  amountOut?: string
  /** The Ethereum address that receives. */
  recipient: string
  /** When the sell was sent, in ms. */
  createdAt: number
  /** When the order reached `filled` or `refunded`, in ms. */
  settledAt?: number
  /**
   * The user was told how the sell ended (toast, system notification, analytics). Set by the write
   * that settles the order, so it is told once per browser.
   */
  reported: boolean
  /** The sold token's symbol, for display. */
  symbol?: string
  /** The swap's coarse USD size, for analytics. */
  usdBucket?: string
  /** Alpha the batch left staked at the account's EVM mirror (`recoverStake` takes it). */
  strandedAlpha?: {
    netuid: number
    /** 32-byte hex. */
    hotkey: Hex
    /** Set once it was moved back, or found to hold nothing. */
    returned?: { hash?: Hex; amount?: string }
  }
  /**
   * A refunded order's USDC was moved out of the account's EVM address (`recoverRefund`), or found
   * gone: `to` and `hash` when this wallet moved it.
   */
  refundMove?: { to?: string; hash?: Hex; amount?: string }
}

const HASH = /^0x[0-9a-fA-F]{64}$/
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const DOT_DECIMAL = /^\d{1,40}(\.\d{1,36})?$/
const MAX_SYMBOL_LENGTH = 32
const MAX_TEXT_LENGTH = 128

const isHash = (value: unknown): value is Hex => typeof value === "string" && HASH.test(value)

const ORDER_STATES: ReadonlySet<string> = new Set<OrderState>([
  "open",
  "awaiting-refund",
  "filled",
  "refunded",
])

const STATUSES: ReadonlySet<string> = new Set<SellRecordStatus>([
  ...(ORDER_STATES as ReadonlySet<OrderState>),
  "unconfirmed",
  "notOpened",
  "notIncluded",
])

/** `filled` and `refunded` are final: nothing more happens to the order. */
export const isSettledOrderState = (status: SellRecordStatus): status is "filled" | "refunded" =>
  status === "filled" || status === "refunded"

/** The order is open or awaiting its refund: something will still happen to it. */
export const isUnfinishedOrder = (record: Pick<CrossChainSellRecord, "status" | "order">) =>
  record.order !== undefined && (record.status === "open" || record.status === "awaiting-refund")

/** A sell's id: its extrinsic hash, any case. */
export const sellRecordId = (extrinsicHash: string): string => extrinsicHash.toLowerCase()

/** The id of alpha left at the mirror by a batch whose hash isn't known. */
export const strandedSellRecordId = ({
  address,
  netuid,
  hotkey,
}: {
  address: string
  netuid: number
  hotkey: string
}): string => `stranded:${address}:${netuid}:${hotkey.toLowerCase()}`

// -------------------------------------------------------------------------------- builders

const outputDecimals = (to: SellRecordOutput) => (to === "USDC" ? USDC_DECIMALS : ETH_DECIMALS)

type BuildSellRecordParams = {
  address: string
  from: SellRecordInput
  to: SellRecordOutput
  /** Paid, in rao (TAO and alpha alike). */
  amountInRaw: bigint
  /** Quoted to arrive, in the output's base units, when known. */
  amountOutRaw?: bigint
  recipient: string
  symbol?: string
  usdBucket?: string
  now: number
}

const baseRecord = ({
  address,
  from,
  to,
  amountInRaw,
  amountOutRaw,
  recipient,
  symbol,
  usdBucket,
  now,
}: BuildSellRecordParams) => ({
  version: SELL_RECORD_VERSION,
  address,
  from,
  to,
  amountIn: formatRawAmount(amountInRaw, TAO_DECIMALS),
  ...(amountOutRaw !== undefined && {
    amountOut: formatRawAmount(amountOutRaw, outputDecimals(to)),
  }),
  recipient,
  createdAt: now,
  reported: false,
  ...(symbol !== undefined && isSymbol(symbol) && { symbol }),
  ...(usdBucket !== undefined && { usdBucket }),
})

/** A sell whose order just opened (`execute` returned it). */
export function openedSellRecord(
  params: BuildSellRecordParams & { extrinsicHash: Hex; order: SellOrderRef },
): CrossChainSellRecord {
  const { extrinsicHash, order } = params
  const { orderId, originChainId, destinationChainId, fillDeadline } = order
  return {
    ...baseRecord(params),
    id: sellRecordId(extrinsicHash),
    extrinsicHash,
    status: "open",
    order: { orderId, originChainId, destinationChainId, fillDeadline },
  }
}

/** A sell sent but not seen in a block: it may still be included. */
export function unconfirmedSellRecord(
  params: BuildSellRecordParams & { extrinsicHash: Hex },
): CrossChainSellRecord {
  return {
    ...baseRecord(params),
    id: sellRecordId(params.extrinsicHash),
    extrinsicHash: params.extrinsicHash,
    status: "unconfirmed",
  }
}

/** An alpha sell in a block whose swap didn't open: the alpha sits at the account's EVM mirror. */
export function strandedSellRecord(
  params: BuildSellRecordParams & {
    extrinsicHash?: Hex
    strandedAlpha: { netuid: number; hotkey: Hex }
  },
): CrossChainSellRecord {
  const { extrinsicHash, strandedAlpha, address } = params
  return {
    ...baseRecord(params),
    id:
      extrinsicHash !== undefined
        ? sellRecordId(extrinsicHash)
        : strandedSellRecordId({ address, ...strandedAlpha }),
    ...(extrinsicHash !== undefined && { extrinsicHash }),
    status: "notOpened",
    strandedAlpha: { netuid: strandedAlpha.netuid, hotkey: strandedAlpha.hotkey },
  }
}

// ------------------------------------------------------------------------------ attention

/** What a sell needs from the user, if anything. */
export type SellAttention =
  /** Sent, outcome unknown: "Check again" (a read, never a resend). */
  | "unconfirmed"
  /** Refunded as USDC to the account's EVM address: "Move refund". */
  | "moveRefund"
  /** Alpha left at the account's EVM mirror: "Move back to this account". */
  | "returnAlpha"

export function sellAttention(record: CrossChainSellRecord): SellAttention | null {
  if (record.status === "unconfirmed") return "unconfirmed"
  if (record.status === "refunded" && record.refundMove === undefined) return "moveRefund"
  if (record.status === "notOpened" && record.strandedAlpha && !record.strandedAlpha.returned)
    return "returnAlpha"
  return null
}

/**
 * The sells that need the user, newest first. `isOwnAddress` keeps those of accounts still in the
 * wallet (only they can act on them).
 */
export function sellsNeedingAttention(
  list: readonly CrossChainSellRecord[],
  isOwnAddress: (address: string) => boolean = () => true,
): CrossChainSellRecord[] {
  return list.filter((record) => sellAttention(record) !== null && isOwnAddress(record.address))
}

/**
 * The orders to follow: unfinished ones whose fill deadline is ahead or less than
 * `TRACK_GRACE_SECONDS` past, so an old record that never settles doesn't load the swap SDK on every
 * page; with `includeAll` (Recent swaps open), every unfinished one.
 */
export function sellsToTrack(
  list: readonly CrossChainSellRecord[],
  { nowSeconds, includeAll }: { nowSeconds: number; includeAll: boolean },
): CrossChainSellRecord[] {
  return list.filter(
    (record) => isUnfinishedOrder(record) && (includeAll || nowSeconds < trackingCutoff(record)),
  )
}

/** When an unfinished order stops being followed on any page (in seconds). */
const trackingCutoff = (record: Pick<CrossChainSellRecord, "order">) =>
  (record.order?.fillDeadline ?? 0) + TRACK_GRACE_SECONDS

/**
 * When `sellsToTrack` next changes with time alone (in seconds): the nearest cutoff still ahead of
 * an unfinished order. A page that follows orders re-checks then, so an order that never settles
 * (stuck awaiting its refund, or whose reads keep failing) isn't polled for ever. `undefined` when
 * no cutoff is ahead.
 */
export function nextTrackingChange(
  list: readonly CrossChainSellRecord[],
  nowSeconds: number,
): number | undefined {
  let next: number | undefined
  for (const record of list) {
    if (!isUnfinishedOrder(record)) continue
    const cutoff = trackingCutoff(record)
    if (cutoff > nowSeconds && (next === undefined || cutoff < next)) next = cutoff
  }
  return next
}

/**
 * The orders this page follows, when only one page of the wallet (the one holding the trackers'
 * lock) follows them all:
 *
 * - that page: `sellsToTrack`, every unfinished one if its own Recent swaps is open;
 * - any other page: only while its Recent swaps is open, the unfinished orders past their cutoff
 *   (which the lead page doesn't follow unless its own Recent swaps is open);
 * - otherwise nothing.
 */
export function trackedSellsFor(
  list: readonly CrossChainSellRecord[],
  {
    nowSeconds,
    isRecentOpen,
    isLeader,
  }: { nowSeconds: number; isRecentOpen: boolean; isLeader: boolean },
): CrossChainSellRecord[] {
  if (isLeader) return sellsToTrack(list, { nowSeconds, includeAll: isRecentOpen })
  if (!isRecentOpen) return []
  return list.filter((record) => isUnfinishedOrder(record) && nowSeconds >= trackingCutoff(record))
}

// ----------------------------------------------------------------------------------- list

/** Newest first. */
const byNewest = (a: CrossChainSellRecord, b: CrossChainSellRecord) => b.createdAt - a.createdAt

/**
 * At most `limit` records of a newest-first list. Over the limit the oldest records that need
 * nothing go first: a record that still needs the user is the only way back to its action.
 */
function capSellRecords(
  list: readonly CrossChainSellRecord[],
  limit: number,
): CrossChainSellRecord[] {
  if (list.length <= limit) return [...list]
  const needed = list.filter((record) => sellAttention(record) !== null).slice(0, limit)
  const others = list
    .filter((record) => sellAttention(record) === null)
    .slice(0, limit - needed.length)
  return [...needed, ...others].sort(byNewest)
}

/** Add a record, or replace the one with the same id. Newest first, capped. */
export function upsertSellRecord(
  list: readonly CrossChainSellRecord[],
  record: CrossChainSellRecord,
  limit = SELL_RECORDS_LIMIT,
): CrossChainSellRecord[] {
  return capSellRecords(
    [record, ...list.filter((item) => item.id !== record.id)].sort(byNewest),
    limit,
  )
}

/**
 * How far a sell has got: a record never moves back down this scale. `unconfirmed` is the least
 * known; the run's own end and "Check again" resolve it; the trackers then move an order on.
 */
const progressOf = (status: SellRecordStatus): number => {
  switch (status) {
    case "unconfirmed":
      return 0
    case "open":
    case "notOpened":
    case "notIncluded":
      return 1
    case "awaiting-refund":
      return 2
    case "filled":
    case "refunded":
      return 3
  }
}

/**
 * Saves what a sell's run learned without undoing what another page learned in the meantime (the
 * trackers, "Check again", a recovery), as `upsertSellRecord` would:
 *
 * - a new sell is added;
 * - an `unconfirmed` record takes whatever comes (keeping when it was sent);
 * - `unconfirmed` never replaces a record that was resolved, settled or recovered;
 * - otherwise the stored record keeps its state and what was done to it (`reported`, `settledAt`, a
 *   refund move, alpha returned) and only gains what it lacks (the order, stranded alpha). An opened
 *   order brings the amounts it was opened with, and outranks a lookup's "didn't open" or "not
 *   included": the run saw it open in its own block.
 *
 * `list` itself comes back when nothing changes.
 */
export function mergeSellRecord(
  list: readonly CrossChainSellRecord[],
  incoming: CrossChainSellRecord,
  limit = SELL_RECORDS_LIMIT,
): CrossChainSellRecord[] {
  const current = list.find((item) => item.id === incoming.id)
  if (!current) return upsertSellRecord(list, incoming, limit)
  if (current.status === "unconfirmed")
    return upsertSellRecord(list, { ...incoming, createdAt: current.createdAt }, limit)
  if (incoming.status === "unconfirmed") return list as CrossChainSellRecord[]

  const isOpened = incoming.status === "open" && incoming.order !== undefined
  const next: CrossChainSellRecord = {
    ...current,
    ...(isOpened && {
      amountIn: incoming.amountIn,
      ...(incoming.amountOut !== undefined && { amountOut: incoming.amountOut }),
    }),
    ...(isOpened && progressOf(current.status) <= 1 && !current.order && { status: "open" }),
    ...(current.order === undefined && incoming.order !== undefined && { order: incoming.order }),
    // Where alpha was left, only for a sell known not to have opened.
    ...(current.status === "notOpened" &&
      current.strandedAlpha === undefined &&
      incoming.strandedAlpha !== undefined && { strandedAlpha: incoming.strandedAlpha }),
    ...(current.symbol === undefined &&
      incoming.symbol !== undefined && { symbol: incoming.symbol }),
    ...(current.usdBucket === undefined &&
      incoming.usdBucket !== undefined && { usdBucket: incoming.usdBucket }),
  }
  const isSame = (Object.keys(next) as (keyof CrossChainSellRecord)[]).every(
    (key) => next[key] === current[key],
  )
  return isSame ? (list as CrossChainSellRecord[]) : upsertSellRecord(list, next, limit)
}

/**
 * Forgets a sell that moved nothing (`unconfirmed`, or `notIncluded`): the run's batch was rolled
 * back, or the user removed a send not confirmed yet. A record another page has since resolved
 * otherwise (an order opened, alpha left at the mirror) is kept. `list` itself when nothing goes.
 */
export function discardUnresolvedSell(
  list: CrossChainSellRecord[],
  id: string,
): CrossChainSellRecord[] {
  const next = list.filter(
    (item) => item.id !== id || (item.status !== "unconfirmed" && item.status !== "notIncluded"),
  )
  return next.length === list.length ? list : next
}

/** Without the record `id`; `list` itself when there is none. */
export function removeSellRecord(list: CrossChainSellRecord[], id: string): CrossChainSellRecord[] {
  const next = list.filter((item) => item.id !== id)
  return next.length === list.length ? list : next
}

/** `update` applied to the record `id`; `list` itself when there is none or nothing changes. */
function updateRecord(
  list: CrossChainSellRecord[],
  id: string,
  update: (record: CrossChainSellRecord) => CrossChainSellRecord,
): CrossChainSellRecord[] {
  const index = list.findIndex((item) => item.id === id)
  if (index === -1) return list
  const next = update(list[index])
  return next === list[index] ? list : list.map((item, i) => (i === index ? next : item))
}

/**
 * A state the order was seen in. Reaching `filled` or `refunded` stamps `settledAt` once, and
 * `settles` is `true` only for the write that moves an unreported order there: that write tells
 * the user (toast, system notification, analytics) and marks it `reported`, so another page that
 * writes it, or reads it later, tells nothing. A final state is never moved back. `list` itself
 * comes back when nothing changes, so a repeated status writes nothing.
 */
export function applySellOrderState(
  list: CrossChainSellRecord[],
  id: string,
  state: OrderState,
  now: number,
): { list: CrossChainSellRecord[]; settles: boolean } {
  let settles = false
  const next = updateRecord(list, id, (record) => {
    if (
      !record.order ||
      record.status === state ||
      isSettledOrderState(record.status) ||
      !ORDER_STATES.has(record.status)
    )
      return record
    if (!isSettledOrderState(state)) return { ...record, status: state }
    settles = !record.reported
    return {
      ...record,
      status: state,
      settledAt: record.settledAt ?? now,
      reported: true,
    }
  })
  return { list: next, settles }
}

/** What a look at an unconfirmed send's extrinsic found. */
export type UnconfirmedSellOutcome =
  /** In a block, and it opened the order. */
  | { kind: "opened"; order: SellOrderRef }
  /** In a block, but the swap didn't open; for alpha, where the stake now sits. */
  | { kind: "notOpened"; strandedAlpha?: { netuid: number; hotkey: Hex } }
  /** Never in a block, or failed and rolled back: nothing moved. */
  | { kind: "notIncluded" }

/**
 * An unconfirmed send resolved. `resolved` is `true` only for the write that moved it from
 * `unconfirmed`, so its result is reported once even with another page checking the same send.
 */
export function resolveUnconfirmedSell(
  list: CrossChainSellRecord[],
  id: string,
  outcome: UnconfirmedSellOutcome,
): { list: CrossChainSellRecord[]; resolved: boolean } {
  let resolved = false
  const next = updateRecord(list, id, (record) => {
    if (record.status !== "unconfirmed") return record
    resolved = true
    switch (outcome.kind) {
      case "opened": {
        const { orderId, originChainId, destinationChainId, fillDeadline } = outcome.order
        return {
          ...record,
          status: "open",
          order: { orderId, originChainId, destinationChainId, fillDeadline },
        }
      }
      case "notOpened":
        return {
          ...record,
          status: "notOpened",
          ...(outcome.strandedAlpha && {
            strandedAlpha: {
              netuid: outcome.strandedAlpha.netuid,
              hotkey: outcome.strandedAlpha.hotkey,
            },
          }),
        }
      case "notIncluded":
        return { ...record, status: "notIncluded" }
    }
  })
  return { list: next, resolved }
}

/**
 * After `recoverRefund` moved what was at an account's EVM address (or found nothing there): the
 * refunded, unmoved sells of that account whose refund was there when the balance was read are
 * marked moved. `settledBy` (ms) is when that read could have happened at the earliest: a refund
 * this wallet saw land after it may have arrived too late to be moved, so it keeps needing the user
 * (until a later read of the address finds it empty). Without `settledBy`, every one is marked.
 */
export function markSellRefundsMoved(
  list: CrossChainSellRecord[],
  {
    address,
    move,
    isSameAddress,
    settledBy,
  }: {
    address: string
    move: NonNullable<CrossChainSellRecord["refundMove"]>
    /** Compares two SS58 addresses by account (formats differ). */
    isSameAddress: (a: string, b: string) => boolean
    settledBy?: number
  },
): CrossChainSellRecord[] {
  const next = list.map((record) =>
    record.status === "refunded" &&
    record.refundMove === undefined &&
    isSameAddress(record.address, address) &&
    (settledBy === undefined || record.settledAt === undefined || record.settledAt <= settledBy)
      ? { ...record, refundMove: { ...move } }
      : record,
  )
  return next.some((record, index) => record !== list[index]) ? next : list
}

/**
 * After `recoverStake` returned the alpha at an account's mirror for one subnet and hotkey (or found
 * none): every sell that left alpha there is marked returned, since `recoverStake` moves it all.
 */
export function markStrandedAlphaReturned(
  list: CrossChainSellRecord[],
  {
    address,
    netuid,
    hotkey,
    returned,
    isSameAddress,
  }: {
    address: string
    netuid: number
    hotkey: string
    returned: NonNullable<NonNullable<CrossChainSellRecord["strandedAlpha"]>["returned"]>
    isSameAddress: (a: string, b: string) => boolean
  },
): CrossChainSellRecord[] {
  const next = list.map((record) => {
    const stranded = record.strandedAlpha
    if (
      !stranded ||
      stranded.returned !== undefined ||
      stranded.netuid !== netuid ||
      stranded.hotkey.toLowerCase() !== hotkey.toLowerCase() ||
      !isSameAddress(record.address, address)
    )
      return record
    return { ...record, strandedAlpha: { ...stranded, returned: { ...returned } } }
  })
  return next.some((record, index) => record !== list[index]) ? next : list
}

// -------------------------------------------------------------------------------- storage

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "" && value.length <= MAX_TEXT_LENGTH

const isSymbol = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "" && value.length <= MAX_SYMBOL_LENGTH

const isAmount = (value: unknown): value is string =>
  typeof value === "string" && DOT_DECIMAL.test(value)

const isNetuid = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 65_535

function parseInput(value: unknown): SellRecordInput | null {
  if (!isObject(value)) return null
  if (value.kind === "tao") return { kind: "tao" }
  if (value.kind === "alpha" && isNetuid(value.netuid) && isText(value.hotkey))
    return { kind: "alpha", netuid: value.netuid, hotkey: value.hotkey }
  return null
}

function parseOrder(value: unknown): SellOrderRef | null {
  if (!isObject(value)) return null
  const { orderId, originChainId, destinationChainId, fillDeadline } = value
  if (
    !isHash(orderId) ||
    !Number.isInteger(originChainId) ||
    !Number.isInteger(destinationChainId) ||
    !isFiniteNumber(fillDeadline)
  )
    return null
  return {
    orderId,
    originChainId: originChainId as number,
    destinationChainId: destinationChainId as number,
    fillDeadline,
  }
}

/** A recovery's result: an optional hash, amount and (for a refund) address. Bad parts dropped. */
function parseMove(value: unknown): { to?: string; hash?: Hex; amount?: string } | null {
  if (!isObject(value)) return null
  const { to, hash, amount } = value
  return {
    ...(typeof to === "string" && EVM_ADDRESS.test(to) && { to }),
    ...(isHash(hash) && { hash }),
    ...(isAmount(amount) && { amount }),
  }
}

function parseStranded(value: unknown): CrossChainSellRecord["strandedAlpha"] | null {
  if (!isObject(value) || !isNetuid(value.netuid) || !isHash(value.hotkey)) return null
  const move = value.returned === undefined ? undefined : parseMove(value.returned)
  const returned = move && {
    ...(move.hash !== undefined && { hash: move.hash }),
    ...(move.amount !== undefined && { amount: move.amount }),
  }
  return { netuid: value.netuid, hotkey: value.hotkey, ...(returned && { returned }) }
}

/**
 * One stored record, checked; `null` when anything required is missing or wrong, or its version
 * isn't this one. Its `id` is derived again from what it holds (a stored one that disagrees is not
 * trusted). A display detail that doesn't validate is dropped, never the record.
 */
export function parseSellRecord(value: unknown): CrossChainSellRecord | null {
  if (!isObject(value) || value.version !== SELL_RECORD_VERSION) return null
  const from = parseInput(value.from)
  const { extrinsicHash, status, address, to, amountIn, amountOut, recipient, createdAt } = value
  const order = value.order === undefined ? undefined : parseOrder(value.order)
  const strandedAlpha =
    value.strandedAlpha === undefined ? undefined : parseStranded(value.strandedAlpha)
  if (
    !from ||
    (extrinsicHash !== undefined && !isHash(extrinsicHash)) ||
    typeof status !== "string" ||
    !STATUSES.has(status) ||
    !isText(address) ||
    (to !== "USDC" && to !== "ETH") ||
    !isAmount(amountIn) ||
    typeof recipient !== "string" ||
    !EVM_ADDRESS.test(recipient) ||
    !isFiniteNumber(createdAt) ||
    order === null ||
    strandedAlpha === null ||
    // An order's state needs its order, and only a sell with a known hash can be checked again.
    (ORDER_STATES.has(status) && !order) ||
    (status === "unconfirmed" && extrinsicHash === undefined) ||
    (extrinsicHash === undefined && !strandedAlpha)
  )
    return null

  const id =
    extrinsicHash !== undefined
      ? sellRecordId(extrinsicHash)
      : strandedSellRecordId({ address, ...(strandedAlpha as { netuid: number; hotkey: Hex }) })
  const refundMove = value.refundMove === undefined ? undefined : parseMove(value.refundMove)

  return {
    version: SELL_RECORD_VERSION,
    id,
    ...(extrinsicHash !== undefined && { extrinsicHash }),
    status: status as SellRecordStatus,
    ...(order && { order }),
    address,
    from,
    to,
    amountIn,
    ...(isAmount(amountOut) && { amountOut }),
    recipient,
    createdAt,
    ...(isFiniteNumber(value.settledAt) && { settledAt: value.settledAt }),
    reported: value.reported === true,
    ...(isSymbol(value.symbol) && { symbol: value.symbol }),
    ...(isSymbol(value.usdBucket) && { usdBucket: value.usdBucket }),
    ...(strandedAlpha && { strandedAlpha }),
    ...(refundMove && { refundMove }),
  }
}

/**
 * The stored list, from whatever is in storage: JSON text or an already parsed value. Bad JSON or
 * a non-array gives `[]`; bad records are dropped; duplicates keep the newest; newest first, capped.
 */
export function parseStoredSellRecords(stored: unknown): CrossChainSellRecord[] {
  let value = stored
  if (typeof stored === "string") {
    try {
      value = JSON.parse(stored) as unknown
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const records = value
    .slice(0, MAX_STORED_RECORDS_READ)
    .map(parseSellRecord)
    .filter((record): record is CrossChainSellRecord => record !== null)
    .sort(byNewest)
    .filter((record) => {
      if (seen.has(record.id)) return false
      seen.add(record.id)
      return true
    })
  return capSellRecords(records, SELL_RECORDS_LIMIT)
}

/** The list as stored: plain JSON. */
export const serializeSellRecords = (list: readonly CrossChainSellRecord[]): string =>
  JSON.stringify(list)
