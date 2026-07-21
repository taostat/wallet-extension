import { KnownRequestId, KnownRequestTypes } from "extension-core"
import { useEffect } from "react"

import { useRequest, useRequests } from "@ui/state"

import { closeWalletSurfaceAfterApproval } from "./closeWalletSurface"

/** Close the wallet surface only once a request is confirmed absent (avoids side-panel navigation races). */
export const useCloseIfRequestMissing = <T extends KnownRequestTypes>(id: KnownRequestId<T>) => {
  const request = useRequest(id)
  const requests = useRequests()

  useEffect(() => {
    if (request) return

    const isPending = requests.some((req) => req.id === id)
    if (!isPending) void closeWalletSurfaceAfterApproval()
  }, [id, request, requests])
}
