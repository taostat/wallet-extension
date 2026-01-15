import { isInternalHostname } from "./isInternalHostname"

export const isInternalUrl = (url: string | undefined) => {
  if (!url) return false
  try {
    const hostname = new URL(url).hostname
    return isInternalHostname(hostname)
  } catch (e) {
    return false
  }
}
