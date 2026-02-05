import z from "zod/v4"

import log from "../log"
import { ChaindataFileSchema } from "./schema"

type FetchJsonFromTaostatsOptions<T> = {
  schema?: z.ZodType<T>
  signal?: AbortSignal
}

const fetchJsonFromTaostats = async <T>(
  url: string,
  { signal, schema }: FetchJsonFromTaostatsOptions<T> = {},
): Promise<T> => {
  const req = await fetch(url, { signal })

  if (!req.ok) {
    throw new Error(`Failed to fetch from ${url}: ${req.status} ${req.statusText}`)
  }

  const data = await req.json()

  if (schema) {
    const result = schema.safeParse(data)
    if (!result.success)
      log.warn("Failed to parse data from", url, result.error.message, {
        error: result.error,
        data,
      })
    else return result.data as T
  }

  return data as T
}

// export because of generate-init-data script
export const fetchChaindataFromTaostats = (signal?: AbortSignal) =>
  fetchJsonFromTaostats(`${process.env.TAOSTATS_API_URL}/chain-data`, {
    schema: ChaindataFileSchema,
    signal,
  })
