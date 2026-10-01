import { mergeUint8 } from "@polkadot-api/utils"
import { SignerPayloadJSON } from "@polkadot/types/types"
import { Binary } from "polkadot-api"

import { getFeeEstimate } from "./getFeeEstimate"
import { getPayloadWithMetadataHash } from "./getPayloadWithMetadataHash"
import { toPjsHex } from "./papi"
import { Chain, ChainInfo } from "./types"

/**
 * Prices a call with one TransactionPaymentApi_query_info.
 * The extrinsic is fake-signed locally: immortal era, nonce 0, genesis as the block hash.
 * Weight does not depend on the nonce or the head, so this does not read chain state first.
 */
export const getInclusionFee = async (
  chain: Chain,
  chainInfo: ChainInfo,
  palletName: string,
  methodName: string,
  args: unknown,
  address: string,
  genesisHash: `0x${string}`,
) => {
  const { codec, location } = chain.builder.buildCall(palletName, methodName)
  const method = Binary.fromBytes(mergeUint8([new Uint8Array(location), codec.enc(args)]))
  const signedExtensions = chain.metadata.extrinsic.signedExtensions.map((ext) => ext.identifier)

  const basePayload: SignerPayloadJSON = {
    address,
    genesisHash,
    blockHash: genesisHash,
    method: method.asHex(),
    signedExtensions,
    nonce: toPjsHex(0, 4),
    specVersion: toPjsHex(chainInfo.specVersion, 4),
    transactionVersion: toPjsHex(chainInfo.transactionVersion, 4),
    blockNumber: toPjsHex(0, 4),
    era: "0x00",
    tip: toPjsHex(0, 16),
    assetId: undefined,
    version: 4,
  }

  const { payload } = getPayloadWithMetadataHash(chain, chainInfo, basePayload)

  if (payload.signedExtensions.includes("CheckAppId"))
    (payload as SignerPayloadJSON & { appId: number }).appId = 0

  return getFeeEstimate(chain, payload, chainInfo)
}
