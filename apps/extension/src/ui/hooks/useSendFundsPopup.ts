import { Address, Balances } from "@taostats-wallet/balances"
import { TokenId } from "@taostats-wallet/chaindata-provider"
import { detectAddressEncoding } from "@taostats-wallet/crypto"
import { Account } from "extension-core"
import { log } from "extension-shared"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useNavigate } from "react-router-dom"

import { useAccounts, useBalances, useToken } from "@ui/state"
import { IS_POPUP } from "@ui/util/constants"
import { isTransferableToken } from "@ui/util/isTransferableToken"
import { buildSendFundsRoute, openSendFundsFromDashboard } from "@ui/util/sendFundsNavigation"

const isCompatibleAddress = (from: Address, to: Address) => {
  try {
    return detectAddressEncoding(from) === detectAddressEncoding(to)
  } catch (err) {
    log.error("Error detecting address encoding", { from, to, err })
    return false
  }
}

export const useSendFundsPopup = (
  account: Account | null | undefined,
  tokenId?: TokenId,
  tokenSymbol?: string,
  to?: Address,
) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = useToken(tokenId)
  const accounts = useAccounts("owned")
  const balances = useBalances("owned")
  const transferableBalance = useMemo(() => {
    const owned = new Balances(balances.each.filter((b) => !tokenId || b.tokenId === tokenId))
    return owned.sum.planck.transferable
  }, [balances, tokenId])

  const { canSendFunds, cannotSendFundsReason } = useMemo<{
    canSendFunds: boolean
    cannotSendFundsReason?: string
  }>(() => {
    if (account?.type === "watch-only")
      return {
        canSendFunds: false,
        cannotSendFundsReason: t("Watched accounts cannot send funds"),
      }

    if (account?.type === "signet")
      return {
        canSendFunds: false,
        cannotSendFundsReason: t(`Please send funds on Signet: ${account.url}`),
      }
    if (tokenId && transferableBalance === 0n)
      return {
        canSendFunds: false,
        cannotSendFundsReason: t("No tokens available to send"),
      }
    if (accounts.length === 0) {
      return {
        canSendFunds: false,
        cannotSendFundsReason: t("No accounts available"),
      }
    }
    if (to) {
      if (account && !isCompatibleAddress(account.address, to))
        return {
          canSendFunds: false,
          cannotSendFundsReason: t("Incompatible address types"),
        }
      if (!account && !accounts.some((a) => isCompatibleAddress(a.address, to)))
        return {
          canSendFunds: false,
          cannotSendFundsReason: t("None of your accounts can send funds to this address"),
        }
    }
    if (token && !isTransferableToken(token))
      return { canSendFunds: false, cannotSendFundsReason: t("This token is not transferable") }
    return { canSendFunds: true }
  }, [account, accounts, t, to, tokenId, transferableBalance, token])

  const openSendFundsPopup = useCallback(() => {
    if (!canSendFunds) return

    const request = { from: account?.address, tokenId, tokenSymbol, to }

    if (IS_POPUP) {
      navigate(buildSendFundsRoute(request))
      return
    }

    openSendFundsFromDashboard(request)
  }, [account?.address, canSendFunds, navigate, to, tokenId, tokenSymbol])

  return { canSendFunds, cannotSendFundsReason, openSendFundsPopup }
}
