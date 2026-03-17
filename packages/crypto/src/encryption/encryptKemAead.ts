import { xchacha20poly1305 } from "@noble/ciphers/chacha.js"
import { concatBytes } from "@noble/ciphers/utils.js"
import { xxhashAsU8a } from "@polkadot/util-crypto"
import { MlKem768 } from "mlkem"

/**
 * v1 wire format (pre-v2):
 *   kem_len (2 LE) || kem_ct || nonce (24) || aead_ct
 */
export const encryptKemAeadV1 = async (publicKey: Uint8Array, plaintext: Uint8Array) => {
  const kem = new MlKem768()
  const [kemCt, sharedSecret] = await kem.encap(publicKey)

  if (sharedSecret.length !== 32) {
    throw new Error(`Expected 32-byte shared secret, got ${sharedSecret.length}`)
  }

  const nonce = crypto.getRandomValues(new Uint8Array(24))
  const aead = xchacha20poly1305(sharedSecret, nonce)
  const aeadCt = aead.encrypt(plaintext)

  const kemLen = new Uint8Array(2)
  new DataView(kemLen.buffer).setUint16(0, kemCt.length, true)

  return concatBytes(kemLen, kemCt, nonce, aeadCt)
}

/**
 * v2 wire format:
 *   key_hash (16) || kem_len (2 LE) || kem_ct || nonce (24) || aead_ct
 * where key_hash = xxhash128(publicKey) (Twox128-compatible 16-byte hash).
 */
export const encryptKemAeadV2 = async (publicKey: Uint8Array, plaintext: Uint8Array) => {
  const kem = new MlKem768()
  const [kemCt, sharedSecret] = await kem.encap(publicKey)

  if (sharedSecret.length !== 32) {
    throw new Error(`Expected 32-byte shared secret, got ${sharedSecret.length}`)
  }

  const nonce = crypto.getRandomValues(new Uint8Array(24))
  const aead = xchacha20poly1305(sharedSecret, nonce)
  const aeadCt = aead.encrypt(plaintext)

  const kemLen = new Uint8Array(2)
  new DataView(kemLen.buffer).setUint16(0, kemCt.length, true)

  const keyHash = xxhashAsU8a(publicKey, 128)

  return concatBytes(keyHash, kemLen, kemCt, nonce, aeadCt)
}

/**
 * Backwards-compatible alias that preserves the original behaviour (v1 wire format).
 * Callers that need chain-version awareness should use encryptKemAeadV1/encryptKemAeadV2 explicitly.
 */
export const encryptKemAead = encryptKemAeadV1
