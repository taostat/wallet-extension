import { SignerPayloadJSON, WalletTransactionInfo } from "extension-core"

export type TxSubmitButtonTransactionDot = {
  platform: "polkadot"
  payload: SignerPayloadJSON
  txInfo?: WalletTransactionInfo
  txMetadata?: Uint8Array | `0x${string}`
}

export type TxSubmitButtonTransaction = TxSubmitButtonTransactionDot

type TransactionPlatform = TxSubmitButtonTransaction["platform"]

export type TxSubmitButtonProps<
  P extends TransactionPlatform | undefined = undefined,
  Tx = P extends "polkadot"
    ? TxSubmitButtonTransactionDot
    : TxSubmitButtonTransaction | null | undefined,
> = {
  tx: Tx
  containerId?: string
  label?: string
  className?: string
  disabled?: boolean
  /**
   *
   * @param txId hash for polkadot and ethereum, signature for solana
   * @returns
   */
  onSubmit: (txId: string) => void
}
