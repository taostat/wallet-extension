import { getBlockExplorerUrls, Network } from "@taostats-wallet/chaindata-provider"
import { CheckCircleIcon, ExternalLinkIcon, LoaderIcon, XCircleIcon } from "@taostats-wallet/icons"
import { WalletTransaction, WalletTransactionDot } from "extension-core"
import { FC, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

import { useAnyNetwork, useNetworkById, useTransaction } from "@ui/state"

const getBlockExplorerUrl = (network: Network | undefined | null, hash: string) => {
  if (!network) return null
  return getBlockExplorerUrls(network, { type: "transaction", id: hash })[0] ?? null
}

const useTxStatusDetails = (tx?: WalletTransaction) => {
  const { t } = useTranslation()
  const { title, subtitle } = useMemo<{
    title: string
    subtitle: string
  }>(() => {
    // missing tx can occur while loading
    if (!tx)
      return {
        title: "",
        subtitle: "",
      }

    switch (tx.status) {
      case "unknown":
        return {
          title: t("Transaction not found"),
          subtitle: t("Transaction was submitted, but Taostats is unable to track its progress."),
        }
      case "replaced": {
        return {
          title: t("Transaction cancelled"),
          subtitle: t("This transaction has been replaced with another one"),
        }
      }
      case "error":
        return {
          title: t("Failure"),
          subtitle: t("Transaction failed."),
        }
      case "success":
        return {
          title: t("Success"),
          subtitle: t("Your transaction was successful!"),
        }
      case "pending":
        return {
          title: t("Transaction in progress"),
          subtitle: t("This may take a few minutes."),
        }
    }
  }, [tx, t])

  return {
    title,
    subtitle,
  }
}

type TxProgressBaseProps = {
  tx?: WalletTransaction
  className?: string
  blockNumber?: string
  onClose?: () => void
  href?: string | null
}

const TxProgressBase: FC<TxProgressBaseProps> = ({ tx, blockNumber, href, onClose }) => {
  const { t } = useTranslation()
  const { title, subtitle } = useTxStatusDetails(tx)

  return (
    <div className="flex h-full w-full flex-col items-center">
      <div className="text-body mt-8 text-lg font-bold">{title}</div>
      <div className="text-body-secondary mt-12 text-center text-base font-light">{subtitle}</div>

      {tx?.status === "pending" && (
        <div className="my-12 flex w-full justify-center">
          <LoaderIcon className="animate-spin-slow text-secondary h-12 w-12" />
        </div>
      )}

      {tx?.status === "success" && (
        <div className="my-12 flex w-full justify-center">
          <CheckCircleIcon className="text-alert-success h-12 w-12" />
        </div>
      )}

      {tx?.status === "error" && (
        <div className="my-12 flex w-full justify-center">
          <XCircleIcon className="text-alert-error h-12 w-12" />
        </div>
      )}

      <div className="text-body-secondary flex w-full grow flex-col justify-center gap-10 px-10 text-center">
        <div>
          {blockNumber ? (
            <>
              {tx?.confirmed ? t("Confirmed in") : t("Included in")}{" "}
              {href ? (
                <a target="_blank" className="hover:text-body text-grey-200" href={href}>
                  {t("block #{{blockNumber}}", { blockNumber })}{" "}
                  <ExternalLinkIcon className="inline align-text-top" />
                </a>
              ) : (
                <span className="text-body">{t("block #{{blockNumber}}", { blockNumber })}</span>
              )}
            </>
          ) : href ? (
            <Trans t={t}>
              View transaction on{" "}
              <a target="_blank" className="hover:text-body text-grey-200" href={href}>
                block explorer <ExternalLinkIcon className="inline align-text-top" />
              </a>
            </Trans>
          ) : null}
        </div>
        <div className="h-[3.6rem]">
          {tx?.status === "success" && !tx?.confirmed && (
            <div className="text-secondary h-[3.6rem] animate-pulse">
              {t("You may close this window or wait for the transaction to be confirmed")}
            </div>
          )}
        </div>
      </div>
      <Button fullWidth onClick={onClose}>
        {t("Close")}
      </Button>
    </div>
  )
}

type TxProgressDotProps = {
  tx: WalletTransactionDot
  onClose?: () => void
  className?: string
}

const TxProgressDot: FC<TxProgressDotProps> = ({ tx, onClose, className }) => {
  const chain = useNetworkById(tx.networkId)
  const href = useMemo(() => getBlockExplorerUrl(chain, tx.hash), [chain, tx.hash])

  return (
    <TxProgressBase
      tx={tx}
      className={className}
      onClose={onClose}
      blockNumber={tx.blockNumber}
      href={href}
    />
  )
}

type TxProgressProps = {
  hash: string // hash or signature (for solana)
  networkIdOrHash: string
  onClose?: () => void
  className?: string
}

export const TxProgress: FC<TxProgressProps> = ({ hash, networkIdOrHash, onClose, className }) => {
  const tx = useTransaction(hash)
  const network = useAnyNetwork(networkIdOrHash)

  // tx is null if not found in db
  if (tx === null) {
    const href = getBlockExplorerUrl(network, hash)
    return <TxProgressBase href={href} className={className} onClose={onClose} />
  }

  switch (tx?.platform) {
    case "polkadot":
      return <TxProgressDot tx={tx} onClose={onClose} className={className} />
    default:
      return null
  }
}
