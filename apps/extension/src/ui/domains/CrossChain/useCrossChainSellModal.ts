import { TokenId } from "@taostats-wallet/chaindata-provider"
import { log } from "extension-shared"
import { useCallback } from "react"
import { BehaviorSubject } from "rxjs"

import { useGlobalOpenClose } from "@taostats/hooks/useGlobalOpenClose"

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

const openOptions$ = new BehaviorSubject<CrossChainSellOpenOptions | null>(null)

/** The options of the sell being opened, read once when the modal's content mounts. */
export const getCrossChainSellOpenOptions = () => openOptions$.getValue()

export const useCrossChainSellModal = () => {
  const { isOpen, open: innerOpen, close } = useGlobalOpenClose("CrossChainSellModal")

  const open = useCallback(
    (options: CrossChainSellOpenOptions) => {
      log.debug("[cross-chain] Opening a sell", options)
      openOptions$.next(options)
      innerOpen()
    },
    [innerOpen],
  )

  return { isOpen, open, close }
}
