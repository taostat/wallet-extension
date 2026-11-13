import { TokenId } from "@taostats-wallet/chaindata-provider"
import { entryOpenedEvent } from "@taostats-wallet/cross-chain/config"
import { log } from "extension-shared"
import { useCallback } from "react"
import { BehaviorSubject } from "rxjs"

import { useGlobalOpenClose } from "@taostats/hooks/useGlobalOpenClose"

import { captureCrossChainEvent } from "./crossChainAnalytics"

/**
 * What a sell is opened with, fixed by the entry point: the account that pays, and what it sells
 * (its TAO, or its alpha on one netuid and hotkey). SDK-free: entry points import this.
 */
export type CrossChainSellOpenOptions = {
  /** The paying account (SS58). */
  address: string
  /** The wallet's token for what is sold: its balance is the amount available. */
  tokenId: TokenId
  asset: { kind: "tao" } | { kind: "alpha"; netuid: number; hotkey: string }
}

/** What the modal shows when it opens: a sell, or Recent cross-chain swaps. */
export type CrossChainModalView =
  | { kind: "sell"; options: CrossChainSellOpenOptions }
  | { kind: "recent" }

const view$ = new BehaviorSubject<CrossChainModalView | null>(null)

/** What the modal was opened to show, read once when its content mounts. */
export const getCrossChainModalView = () => view$.getValue()

/** The options of the sell being opened, read once when the modal's content mounts. */
export const getCrossChainSellOpenOptions = () => {
  const view = view$.getValue()
  return view?.kind === "sell" ? view.options : null
}

export const useCrossChainSellModal = () => {
  const { isOpen, open: innerOpen, close } = useGlobalOpenClose("CrossChainSellModal")

  const open = useCallback(
    (options: CrossChainSellOpenOptions) => {
      log.debug("[cross-chain] Opening a sell", options)
      view$.next({ kind: "sell", options })
      innerOpen()
      captureCrossChainEvent(entryOpenedEvent())
    },
    [innerOpen],
  )

  /** Recent cross-chain swaps, with their recovery. */
  const openRecent = useCallback(() => {
    view$.next({ kind: "recent" })
    innerOpen()
  }, [innerOpen])

  return { isOpen, open, openRecent, close }
}
