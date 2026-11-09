# Extension keys

## Internal build public key

`internal-public-key.txt` is the Chrome extension **public** key (base64 DER).

It is injected into the manifest **only** when `build=internal`, so teammates get a stable extension ID across install paths.

- Never add this key to production / store builds (enforced in webpack).
- The matching private key is not required for builds or installs and is not stored in this repo.
