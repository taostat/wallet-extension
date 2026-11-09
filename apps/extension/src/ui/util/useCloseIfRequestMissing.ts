import { KnownRequestId, KnownRequestTypes } from "extension-core"
import { useEffect } from "react"

import { useRequest, useRequests } from "@ui/state"

import { closeWalletSurfaceAfterApproval } from "./closeWalletSurface"

/** After a dapp approval resolves, leave the side panel open (or close floating popups). */
export const useCloseIfRequestMissing = <T extends KnownRequestTypes>(id: KnownRequestId<T>) => {
  const request = useRequest(id)
  const requests = useRequests()

  useEffect(() => {
    if (request) return

    const isPending = requests.some((req) => req.id === id)
    if (!isPending) void closeWalletSurfaceAfterApproval()
  }, [id, request, requests])
}
