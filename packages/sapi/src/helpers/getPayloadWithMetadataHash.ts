import { merkleizeMetadata } from "@polkadot-api/merkleize-metadata"
import { toHex } from "@polkadot-api/utils"
import { SignerPayloadJSON } from "@polkadot/types/types"

import log from "../log"
import { getTypeRegistry } from "./getTypeRegistry"
import { Chain, ChainInfo } from "./types"

type MerkleizedMetadata = ReturnType<typeof merkleizeMetadata>

// The Merkle tree and its digest depend on metadata and spec identity, not on the extrinsic.
// Building the tree is the slow part; proofs are taken from the cached tree per payload.
const merkleCache = new WeakMap<
  Chain,
  { cacheKey: string; merkleized: MerkleizedMetadata; metadataHash: `0x${string}` }
>()

const getMerkleizedMetadata = (chain: Chain, chainInfo: ChainInfo) => {
  const { decimals, symbol: tokenSymbol } = chain.token
  const { base58Prefix, specName, specVersion } = chainInfo
  const cacheKey = `${specName}:${specVersion}:${tokenSymbol}:${decimals}:${base58Prefix}`
  const cached = merkleCache.get(chain)
  if (cached?.cacheKey === cacheKey) return cached

  const metadataHashInputs = { tokenSymbol, decimals, base58Prefix, specName, specVersion }
  const merkleized = merkleizeMetadata(chain.hexMetadata, metadataHashInputs)
  const metadataHash = toHex(merkleized.digest()) as `0x${string}`
  log.log("metadataHash", metadataHash, metadataHashInputs)

  const entry = { cacheKey, merkleized, metadataHash }
  merkleCache.set(chain, entry)
  return entry
}

export const getPayloadWithMetadataHash = (
  chain: Chain,
  chainInfo: ChainInfo,
  payload: SignerPayloadJSON,
): { payload: SignerPayloadJSON; txMetadata?: Uint8Array } => {
  if (!chain.hasCheckMetadataHash || !payload.signedExtensions.includes("CheckMetadataHash"))
    return {
      payload,
      txMetadata: undefined,
    }

  try {
    const { merkleized: merkleizedMetadata, metadataHash } = getMerkleizedMetadata(chain, chainInfo)

    const payloadWithMetadataHash = {
      ...payload,
      mode: 1,
      metadataHash,
      withSignedTransaction: true,
    }

    // TODO do this without PJS / registry => waiting for @polkadot-api/tx-utils
    // const { extra, additionalSigned } = getSignedExtensionValues(payload, metadata)
    // const badExtPayload = mergeUint8([fromHex(payload.method), ...extra, ...additionalSigned])

    const registry = getTypeRegistry(chain, payload)
    const extPayload = registry.createType("ExtrinsicPayload", payloadWithMetadataHash)
    const barePayload = extPayload.toU8a(true)

    const txMetadata = merkleizedMetadata.getProofForExtrinsicPayload(barePayload)

    return {
      payload: payloadWithMetadataHash,
      txMetadata,
    }
  } catch (err) {
    log.error("Failed to get shortened metadata", { error: err })
    return {
      payload,
      txMetadata: undefined,
    }
  }
}
