import type { MetadataDef as PjsMetadataDef } from "@polkadot/extension-inject/types"
import type { HexString } from "@polkadot/util/types"
import type { DotNetworkId } from "@taostats-wallet/chaindata-provider"
import { SignerPayloadJSON } from "@substrate/txwrapper-core"

import { WalletTransactionInfo } from "../transactions"
import { SubstrateExtrinsicOutcome } from "./extrinsicEvents"

export interface TMetadataDef extends PjsMetadataDef {
  metadataRpc?: `0x${string}`
}

type SubstrateRequestSend = {
  chainId: DotNetworkId
  method: string
  params: unknown[]
  isCacheable?: boolean
}

type SubstrateRequestChainMetadata = {
  genesisHash: HexString
  specVersion?: number
}

type SubstrateRequestSubmit = {
  payload: SignerPayloadJSON
  signature?: HexString
  txInfo?: WalletTransactionInfo
}

type SubstrateResponseSubmit = {
  hash: HexString
}

/** Sign a payload with a local keypair account, without broadcasting it. */
type SubstrateRequestSign = {
  payload: SignerPayloadJSON
}

export type SubstrateResponseSign = {
  signature: HexString
  /** Hash of the signed extrinsic, known before it is broadcast. */
  extrinsicHash: HexString
}

/** Broadcast a payload signed with `pri(substrate.rpc.sign)`, and wait until it is in a block. */
type SubstrateRequestSubmitAndWatch = {
  payload: SignerPayloadJSON
  signature: HexString
  txInfo?: WalletTransactionInfo
}

/** The block that included the extrinsic (best or finalized), and what the extrinsic did there. */
export type SubstrateResponseSubmitAndWatch = SubstrateExtrinsicOutcome & {
  blockHash: HexString
}

type SubstrateRequestSubmitBittensorMevShield = {
  payload: SignerPayloadJSON
  // doesnt support hardware wallet, enforce it by not having signature here
  txInfo?: WalletTransactionInfo
}

type SubstrateRequestSubmitTaostatsShield = {
  payload: SignerPayloadJSON
  txInfo?: WalletTransactionInfo
  signedInnerTxHex?: `0x${string}`
}

export type SubstrateMessages = {
  "pri(substrate.rpc.send)": [SubstrateRequestSend, unknown]
  "pri(substrate.rpc.submit)": [SubstrateRequestSubmit, SubstrateResponseSubmit]
  "pri(substrate.rpc.sign)": [SubstrateRequestSign, SubstrateResponseSign]
  "pri(substrate.rpc.submitAndWatch)": [
    SubstrateRequestSubmitAndWatch,
    SubstrateResponseSubmitAndWatch,
  ]
  "pri(substrate.rpc.submit.withBittensorMevShield)": [
    SubstrateRequestSubmitBittensorMevShield,
    SubstrateResponseSubmit,
  ]
  "pri(substrate.rpc.submit.withTaostatsShield)": [
    SubstrateRequestSubmitTaostatsShield,
    SubstrateResponseSubmit,
  ]
  "pri(substrate.metadata.get)": [SubstrateRequestChainMetadata, TMetadataDef | undefined]
}
