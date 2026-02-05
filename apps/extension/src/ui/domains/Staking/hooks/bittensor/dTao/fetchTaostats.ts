import { TAOSTATS_API_URL } from "extension-shared"

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const

type FetchTaostatsArgs = {
  path: string
  params?: Record<string, string | number | undefined>
  signal?: AbortSignal
  includeAuthHeader?: boolean
  headers?: HeadersInit
}

export const fetchTaostats = async <T>({
  path,
  params,
  signal,
  headers,
}: FetchTaostatsArgs): Promise<T> => {
  const url = new URL(`${TAOSTATS_API_URL}${path}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      url.searchParams.set(key, String(value))
    })
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    signal,
    headers: {
      ...JSON_HEADERS,
      ...headers,
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(
      `Failed to fetch ${path}: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`,
    )
  }

  return (await response.json()) as T
}
