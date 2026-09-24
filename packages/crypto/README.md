<img src="taostats.svg" alt="Taostats" width="15%" align="right" />

**@taostats-wallet/crypto** contains cryptographic utilities used by the wallet.

## Taostats app QR import

Transfers a single **sr25519** keypair from the Taostats Browser Extension into the Taostats mobile app via a PIN-encrypted QR code. This is not a general wallet backup and does not include a recovery phrase.

Implementation: `src/taostats-app-import.ts`. The mobile app keeps an identical copy of these constants and algorithms — change them in both places together.

### Wire format

```
taostats-app-import:1:<base64url(JSON { v, s, n, c })>
```

| Field | Meaning |
| --- | --- |
| `v` | Envelope version (`1`) |
| `s` | Salt (16 bytes, base64url) |
| `n` | AES-GCM nonce (12 bytes, base64url) |
| `c` | Ciphertext (base64url) |

Plaintext (inside `c`) is JSON: `{ exp, curve, address, name?, secretKey }`.

### Crypto

1. **PIN** — 9 characters from a 32-symbol Crockford-like alphabet (`23456789ABCDEFGHJKMNPQRSTUVWXYZ`), shown as three groups of three. Entropy ≈ 45 bits.
2. **KDF** — Argon2id with OWASP interactive minimum parameters:
   - `m = 19456` (~19 MiB)
   - `t = 2`
   - `p = 1`
   - `dkLen = 32`
3. **Cipher** — AES-256-GCM over the plaintext JSON.
4. **TTL** — `exp` is 5 minutes after encrypt. Enforced on decrypt in the mobile app; it does not stop offline brute-force of a captured QR (PIN entropy + Argon2 cost do).

### Extension-side notes

- Export requires the wallet password (`pri(accounts.taostatsAppImport)`).
- That message type is on `OBFUSCATE_LOG_MESSAGES` in `extension-core` so password/PIN are not written to `console.debug`.
- The secret-key buffer is zeroed after encrypt in the account handler.
