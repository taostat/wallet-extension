/**
 * PIN-encrypted QR payload for transferring a single sr25519 keypair from
 * the Taostats Browser Extension into the Taostats mobile app.
 *
 * Wire format (identical in wallet-extension):
 *   taostats-app-import:1:<base64url(JSON { v, s, n, c })>
 *
 * Argon2id params are fixed so both apps derive the same AES-256-GCM key.
 */

import { gcm } from "@noble/ciphers/aes.js"
import { argon2id } from "@noble/hashes/argon2"

export const TAOSTATS_APP_IMPORT_PREFIX = "taostats-app-import:1:"
export const TAOSTATS_APP_IMPORT_TTL_MS = 5 * 60 * 1000
export const TAOSTATS_APP_IMPORT_CODE_LENGTH = 9
export const TAOSTATS_APP_IMPORT_GROUP_SIZE = 3
export const TAOSTATS_APP_IMPORT_GROUP_COUNT = 3

/** Crockford-like alphabet without 0/O/1/I/L (32 symbols). */
export const TAOSTATS_APP_IMPORT_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"

export const TAOSTATS_APP_IMPORT_ARGON2 = {
  t: 2,
  m: 4_096,
  p: 1,
  dkLen: 32,
} as const

export const TAOSTATS_APP_IMPORT_SALT_BYTES = 16
export const TAOSTATS_APP_IMPORT_NONCE_BYTES = 12

export type TaostatsAppImportCurve = "sr25519"

export type TaostatsAppImportPlaintext = {
  exp: number
  curve: TaostatsAppImportCurve
  address: string
  name?: string
  secretKey: string
}

export class TaostatsAppImportError extends Error {
  constructor(
    readonly code:
      | "invalid_payload"
      | "wrong_pin"
      | "expired"
      | "unsupported_curve"
      | "invalid_pin",
    message: string,
  ) {
    super(message)
    this.name = "TaostatsAppImportError"
  }
}

const getRandomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export const generateTaostatsAppImportCode = (): string => {
  const bytes = getRandomBytes(TAOSTATS_APP_IMPORT_CODE_LENGTH)
  let code = ""
  for (const byte of bytes) {
    code += TAOSTATS_APP_IMPORT_ALPHABET[byte % TAOSTATS_APP_IMPORT_ALPHABET.length]
  }
  return code
}

export const normalizeTaostatsAppImportCode = (value: string): string => {
  return value.toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g, "")
}

export const splitTaostatsAppImportCode = (code: string): [string, string, string] => {
  const normalized = normalizeTaostatsAppImportCode(code)
  if (normalized.length !== TAOSTATS_APP_IMPORT_CODE_LENGTH) {
    throw new TaostatsAppImportError("invalid_pin", "Import code must be 9 characters")
  }
  return [normalized.slice(0, 3), normalized.slice(3, 6), normalized.slice(6, 9)]
}

export const formatTaostatsAppImportCode = (code: string): string => {
  return splitTaostatsAppImportCode(code).join("-")
}

export const isValidTaostatsAppImportCode = (value: string): boolean => {
  return normalizeTaostatsAppImportCode(value).length === TAOSTATS_APP_IMPORT_CODE_LENGTH
}

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64")
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "")
}

const base64UrlToBytes = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const padLength = (4 - (padded.length % 4)) % 4
  const base64 = padded + "=".repeat(padLength)
  if (typeof atob === "function") {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  return Uint8Array.from(Buffer.from(base64, "base64"))
}

const deriveKey = (pin: string, salt: Uint8Array): Uint8Array => {
  const normalized = normalizeTaostatsAppImportCode(pin)
  if (normalized.length !== TAOSTATS_APP_IMPORT_CODE_LENGTH) {
    throw new TaostatsAppImportError("invalid_pin", "Import code must be 9 characters")
  }
  return argon2id(new TextEncoder().encode(normalized), salt, {
    t: TAOSTATS_APP_IMPORT_ARGON2.t,
    m: TAOSTATS_APP_IMPORT_ARGON2.m,
    p: TAOSTATS_APP_IMPORT_ARGON2.p,
    dkLen: TAOSTATS_APP_IMPORT_ARGON2.dkLen,
  })
}

type EncryptOptions = {
  pin: string
  plaintext: Omit<TaostatsAppImportPlaintext, "exp"> & { exp?: number }
  now?: number
  salt?: Uint8Array
  nonce?: Uint8Array
}

export const encryptTaostatsAppImport = ({
  pin,
  plaintext,
  now = Date.now(),
  salt = getRandomBytes(TAOSTATS_APP_IMPORT_SALT_BYTES),
  nonce = getRandomBytes(TAOSTATS_APP_IMPORT_NONCE_BYTES),
}: EncryptOptions): string => {
  if (plaintext.curve !== "sr25519") {
    throw new TaostatsAppImportError("unsupported_curve", "Only sr25519 accounts can be imported")
  }

  const body: TaostatsAppImportPlaintext = {
    exp: plaintext.exp ?? now + TAOSTATS_APP_IMPORT_TTL_MS,
    curve: plaintext.curve,
    address: plaintext.address,
    name: plaintext.name,
    secretKey: plaintext.secretKey,
  }

  const key = deriveKey(pin, salt)
  const aes = gcm(key, nonce)
  const ciphertext = aes.encrypt(new TextEncoder().encode(JSON.stringify(body)))

  const envelope = JSON.stringify({
    v: 1,
    s: bytesToBase64Url(salt),
    n: bytesToBase64Url(nonce),
    c: bytesToBase64Url(ciphertext),
  })

  return `${TAOSTATS_APP_IMPORT_PREFIX}${bytesToBase64Url(new TextEncoder().encode(envelope))}`
}

export const decryptTaostatsAppImport = ({
  payload,
  pin,
  now = Date.now(),
}: {
  payload: string
  pin: string
  now?: number
}): TaostatsAppImportPlaintext => {
  const trimmed = payload.trim()
  if (!trimmed.startsWith(TAOSTATS_APP_IMPORT_PREFIX)) {
    throw new TaostatsAppImportError(
      "invalid_payload",
      "QR code is not a Taostats Browser Extension import code",
    )
  }

  let envelope: { v?: number; s?: string; n?: string; c?: string }
  try {
    envelope = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(trimmed.slice(TAOSTATS_APP_IMPORT_PREFIX.length))),
    ) as { v?: number; s?: string; n?: string; c?: string }
  } catch {
    throw new TaostatsAppImportError("invalid_payload", "QR code is malformed")
  }

  if (envelope.v !== 1 || !envelope.s || !envelope.n || !envelope.c) {
    throw new TaostatsAppImportError("invalid_payload", "QR code is not a supported import version")
  }

  const salt = base64UrlToBytes(envelope.s)
  const nonce = base64UrlToBytes(envelope.n)
  const ciphertext = base64UrlToBytes(envelope.c)

  if (
    salt.length !== TAOSTATS_APP_IMPORT_SALT_BYTES ||
    nonce.length !== TAOSTATS_APP_IMPORT_NONCE_BYTES
  ) {
    throw new TaostatsAppImportError("invalid_payload", "QR code is malformed")
  }

  const key = deriveKey(pin, salt)
  const aes = gcm(key, nonce)

  let decoded: TaostatsAppImportPlaintext
  try {
    decoded = JSON.parse(
      new TextDecoder().decode(aes.decrypt(ciphertext)),
    ) as TaostatsAppImportPlaintext
  } catch {
    throw new TaostatsAppImportError("wrong_pin", "Import code does not match")
  }

  if (decoded.curve !== "sr25519" || !decoded.address || !decoded.secretKey) {
    throw new TaostatsAppImportError("invalid_payload", "QR payload is missing account data")
  }

  if (typeof decoded.exp !== "number" || now >= decoded.exp) {
    throw new TaostatsAppImportError(
      "expired",
      "This QR code has expired. Generate a new one in the extension.",
    )
  }

  return decoded
}
