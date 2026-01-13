import { Observable, shareReplay } from "rxjs"

import log from "../log"
import bittensorChaindata from "./bittensor-chaindata.json"
import { fetchChaindata } from "./net"
import { Chaindata, ChaindataFileSchema } from "./schema"

// Temporarily disabled - will be re-enabled to fetch from a different source in the future
const ENABLE_GITHUB_FETCH = false

const REFRESH_INTERVAL = 300_000 // 5 mins

let lastUpdatedAt = 0

// Original GitHub fetch Observable (currently disabled)
const githubChaindataFetch$ = new Observable<Chaindata>((subscriber) => {
  const controller = new AbortController()
  subscriber.add(() => controller.abort())

  let timeout: ReturnType<typeof setTimeout> | null = null
  subscriber.add(() => timeout && clearTimeout(timeout))

  const refresh = async () => {
    try {
      const delay = Math.max(0, lastUpdatedAt + 60_000 - Date.now())
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
      if (controller.signal.aborted) return

      log.debug("[githubChaindata$] Refreshing chaindata from GitHub")
      const data = await fetchChaindata(controller.signal)
      lastUpdatedAt = Date.now()

      const start = performance.now()
      const validation = ChaindataFileSchema.safeParse(data)
      log.debug(
        "[githubChaindata$] Chaindata schema validation: %sms",
        (performance.now() - start).toFixed(2),
      )
      if (!validation.success) throw new Error("GitHub chaindata failed schema validation")

      subscriber.next(validation.data)
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return

      log.error("Failed to fetch chaindata", error)
      if (!subscriber.closed) subscriber.error(error)
    } finally {
      if (!controller.signal.aborted) timeout = setTimeout(refresh, REFRESH_INTERVAL)
    }
  }
  refresh()
}).pipe(shareReplay({ bufferSize: 1, refCount: true }))

// Local Bittensor chaindata Observable (static lookup)
const localBittensorChaindata$ = new Observable<Chaindata>((subscriber) => {
  try {
    log.debug("[localBittensorChaindata$] Loading local bittensor-chaindata.json")

    const start = performance.now()
    const validation = ChaindataFileSchema.safeParse(bittensorChaindata)
    log.debug(
      "[localBittensorChaindata$] Chaindata schema validation: %sms",
      (performance.now() - start).toFixed(2),
    )
    if (!validation.success) throw new Error("Local bittensor chaindata failed schema validation")

    subscriber.next(validation.data)
  } catch (error) {
    log.error("Failed to load local chaindata", error)
    if (!subscriber.closed) subscriber.error(error)
  }
}).pipe(shareReplay({ bufferSize: 1, refCount: true }))

// Export the active Observable (switch between fetch and local by toggling ENABLE_GITHUB_FETCH)
export const githubChaindata$ = ENABLE_GITHUB_FETCH
  ? githubChaindataFetch$
  : localBittensorChaindata$
