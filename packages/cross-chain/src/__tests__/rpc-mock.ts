/**
 * A `fetch` stand-in for viem's HTTP transport: records every URL and answers JSON-RPC requests
 * with `answer(method, params, url)`. With `urls`, only those endpoints are served. Anything it
 * can't answer fails the request loudly.
 */
export const mockJsonRpcFetch = (
  answer: (method: string, params: unknown[], url: string) => unknown,
  { urls }: { urls?: readonly string[] } = {},
) => {
  const requests: Array<{ url: string; method: string }> = []
  const spy = jest.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const body = JSON.parse(String(init?.body)) as { id: number; method: string; params: unknown[] }
    requests.push({ url, method: body.method })
    if (urls && !urls.includes(url)) throw new Error(`unexpected RPC endpoint ${url}`)
    const result = answer(body.method, body.params ?? [], url)
    if (result === undefined) throw new Error(`unexpected JSON-RPC ${body.method} at ${url}`)
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  })
  return { requests, restore: () => spy.mockRestore() }
}
