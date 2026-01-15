import { DEBUG, TAOSTATS_WEB_APP_DOMAIN } from "../constants"

export const isInternalHostname = (hostname: string | undefined) => {
  return (
    hostname === TAOSTATS_WEB_APP_DOMAIN ||
    (DEBUG && ["localhost", "127.0.0.1"].includes(hostname ?? ""))
  )
}
