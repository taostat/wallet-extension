import type { SignerPayloadJSON, SignerPayloadRaw, SignerResult } from "@polkadot/types/types"
import {
  RequestSigningApproveSignature as PolkadotRequestSigningApproveSignature,
  RequestSign,
} from "@polkadot/extension-base/background/types"
import { Account } from "@taostats-wallet/keyring"
import { RpcTransactionRequest } from "viem"

import { BaseRequest, BaseRequestId } from "../../types/base"

export type { SignerPayloadJSON, SignerPayloadRaw } // Make this available elsewhere also

export type {
  RequestSign,
  RequestSigningApprovePassword,
  RequestSigningCancel,
  RequestSigningIsLocked,
  ResponseSigningIsLocked,
} from "@polkadot/extension-base/background/types"

export type SigningRequestID<T extends keyof SigningRequests> = BaseRequestId<T>
export type AnySigningRequestID = `${keyof SigningRequests}.${string}`

export type AnySigningRequestIdOnly = {
  id: AnySigningRequestID
}

export type KnownSigningRequestIdOnly<T extends keyof SigningRequests> = {
  id: SigningRequestID<T>
}

export type KnownSigningRequestApprove<T extends keyof SigningRequests> = {
  id: SigningRequestID<T>
  payload?: SignerPayloadJSON
}

export type RequestSigningApproveSignature = Omit<PolkadotRequestSigningApproveSignature, "id"> & {
  id: SigningRequestID<SUBSTRATE_SIGN>
  payload?: SignerPayloadJSON
}

interface BaseSigningRequest<T extends keyof SigningRequests> extends BaseRequest<T> {
  id: SigningRequestID<T>
  url: string
}

type SUBSTRATE_SIGN = "substrate-sign"
const SUBSTRATE_SIGN: SUBSTRATE_SIGN = "substrate-sign"

export interface SubstrateSigningRequest extends BaseSigningRequest<SUBSTRATE_SIGN> {
  request: RequestSign
  account: Account
}

export type SubstrateSignResponse = Omit<SignerResult, "id"> & { id: string }

export const SIGNING_TYPES = {
  SUBSTRATE_SIGN,
}

export type AnySigningRequest = SubstrateSigningRequest

export type SigningRequests = {
  "substrate-sign": [SubstrateSigningRequest, SubstrateSignResponse]
}

export type TransactionMethod = {
  section: string
  method: string
  docs: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any
}

export type TransactionPayload = {
  blockHash: string
  era: {
    MortalEra?: {
      period: string
      phase: string
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ImmortalEra?: any
  }
  genesisHash: string
  method: string
  nonce: string
  specVersion: string
  tip: string
  transactionVersion?: string
}

export type TransactionDetails = {
  payload?: TransactionPayload
  method?: TransactionMethod
  partialFee?: string
}

export type SignerPayloadGenesisHash = SignerPayloadJSON["genesisHash"] // extracting this out because it's liable to change to HexString in future

export interface SigningMessages {
  // signing message signatures
  "pri(signing.approveSign)": [KnownSigningRequestApprove<"substrate-sign">, boolean]
  "pri(signing.approveSign.hardware)": [RequestSigningApproveSignature, boolean]
  "pri(signing.approveSign.qr)": [RequestSigningApproveSignature, boolean]
  "pri(signing.approveSign.signet)": [KnownSigningRequestIdOnly<"substrate-sign">, boolean]
  "pri(signing.cancel)": [KnownSigningRequestIdOnly<"substrate-sign">, boolean]
}
