import {
  decryptTaostatsAppImport,
  encryptTaostatsAppImport,
  formatTaostatsAppImportCode,
  generateTaostatsAppImportCode,
  isValidTaostatsAppImportCode,
  normalizeTaostatsAppImportCode,
  splitTaostatsAppImportCode,
  TAOSTATS_APP_IMPORT_ALPHABET,
  TAOSTATS_APP_IMPORT_CODE_LENGTH,
  TAOSTATS_APP_IMPORT_PREFIX,
  TaostatsAppImportError,
} from "./taostats-app-import"

const FIXED_SALT = Uint8Array.from({ length: 16 }, (_, i) => i + 1)
const FIXED_NONCE = Uint8Array.from({ length: 12 }, (_, i) => i + 20)
const PIN = "K7M9QX2WR"
const PLAINTEXT = {
  curve: "sr25519" as const,
  address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  name: "Alice",
  secretKey: "0x" + "ab".repeat(64),
}

describe("taostats-app-import", () => {
  it("generates a 9-character code from the unambiguous alphabet", () => {
    const code = generateTaostatsAppImportCode()
    expect(code).toHaveLength(TAOSTATS_APP_IMPORT_CODE_LENGTH)
    expect([...code].every((ch) => TAOSTATS_APP_IMPORT_ALPHABET.includes(ch))).toBe(true)
  })

  it("normalizes and groups the code", () => {
    expect(normalizeTaostatsAppImportCode("k7m-9qx-2wr")).toBe(PIN)
    expect(splitTaostatsAppImportCode("k7m9qx2wr")).toEqual(["K7M", "9QX", "2WR"])
    expect(formatTaostatsAppImportCode("k7m-9qx-2wr")).toBe("K7M-9QX-2WR")
    expect(isValidTaostatsAppImportCode("K7M-9QX-2WR")).toBe(true)
    expect(isValidTaostatsAppImportCode("short")).toBe(false)
  })

  it("round-trips encrypt and decrypt, and rejects wrong pin and expiry", () => {
    const now = 1_700_000_000_000
    const payload = encryptTaostatsAppImport({
      pin: "k7m-9qx-2wr",
      plaintext: PLAINTEXT,
      now,
      salt: FIXED_SALT,
      nonce: FIXED_NONCE,
    })

    expect(payload.startsWith(TAOSTATS_APP_IMPORT_PREFIX)).toBe(true)

    const decrypted = decryptTaostatsAppImport({
      payload,
      pin: PIN,
      now: now + 60_000,
    })

    expect(decrypted.address).toBe(PLAINTEXT.address)
    expect(decrypted.name).toBe(PLAINTEXT.name)
    expect(decrypted.secretKey).toBe(PLAINTEXT.secretKey)
    expect(decrypted.curve).toBe("sr25519")
    expect(decrypted.exp).toBe(now + 5 * 60 * 1000)

    try {
      decryptTaostatsAppImport({ payload, pin: "AAAAAAAAA", now: now + 60_000 })
      throw new Error("expected wrong_pin")
    } catch (error) {
      expect((error as TaostatsAppImportError).code).toBe("wrong_pin")
    }

    try {
      decryptTaostatsAppImport({
        payload,
        pin: PIN,
        now: now + 5 * 60 * 1000,
      })
      throw new Error("expected expired")
    } catch (error) {
      expect((error as TaostatsAppImportError).code).toBe("expired")
    }
  })

  it("rejects a payload that is not a Taostats import QR", () => {
    expect(() => decryptTaostatsAppImport({ payload: "https://taostats.io", pin: PIN })).toThrow(
      TaostatsAppImportError,
    )
  })
})
