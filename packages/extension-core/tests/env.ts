// Shared by extension-core and apps/extension (see their vitest.config.mts).
import { Buffer } from "node:buffer"
import { CompressionStream, DecompressionStream } from "node:stream/web"
import { TextDecoder, TextEncoder } from "node:util"

import type { Environment } from "vitest/runtime"
import { builtinEnvironments } from "vitest/runtime"

/** jsdom, with the Node globals that jsdom lacks or implements incompatibly */
const jsdomWithNodeGlobals: Environment = {
  name: "jsdom-with-node-globals",
  viteEnvironment: "client",
  setupVM: (options) => builtinEnvironments.jsdom.setupVM!(options),
  async setup(global, options) {
    const { teardown } = await builtinEnvironments.jsdom.setup(global, options)

    // Node's webcrypto (jsdom's has no `subtle`)
    Object.defineProperty(global, "crypto", { value: globalThis.crypto, configurable: true })
    global.CryptoKey = globalThis.CryptoKey

    // jsdom's Uint8Array isn't compatible with 'node:crypto'
    global.Uint8Array = Object.getPrototypeOf(Object.getPrototypeOf(Buffer.from(""))).constructor

    global.CompressionStream = CompressionStream
    global.DecompressionStream = DecompressionStream
    global.TextEncoder = TextEncoder
    global.TextDecoder = TextDecoder

    return { teardown }
  },
}

export default jsdomWithNodeGlobals
