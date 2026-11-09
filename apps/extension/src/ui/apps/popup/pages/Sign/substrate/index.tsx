import { isJsonPayload, KnownSigningRequestIdOnly } from "extension-core"
import { Suspense, useMemo } from "react"
import { Navigate, useParams } from "react-router-dom"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { PolkadotSigningRequestProvider } from "@ui/domains/Sign/SignRequestContext"
import { useRequest } from "@ui/state"
import { useCloseIfRequestMissing } from "@ui/util/useCloseIfRequestMissing"

import { SignPopupShimmer } from "../SignPopupShimmer"
import { PolkadotSignMessageRequest } from "./Message"
import { PolkadotSignTransactionRequest } from "./Transaction"

export const SubstrateSignRequest = () => {
  const { id } = useParams() as KnownSigningRequestIdOnly<"substrate-sign">
  const signingRequest = useRequest(id)

  useCloseIfRequestMissing(id)

  const payloadType = useMemo(() => {
    const payload = signingRequest?.request?.payload
    if (!payload) return "unknown"
    return isJsonPayload(payload) ? "transaction" : "message"
  }, [signingRequest?.request?.payload])

  if (!signingRequest) return <Navigate to="/portfolio" replace />

  switch (payloadType) {
    case "transaction":
      return (
        <Suspense
          fallback={
            <>
              <SignPopupShimmer />
              <SuspenseTracker name="SubstrateSignRequest" />
            </>
          }
        >
          <PolkadotSigningRequestProvider signingRequest={signingRequest}>
            <PolkadotSignTransactionRequest />
          </PolkadotSigningRequestProvider>
        </Suspense>
      )

    case "message":
      return (
        <PolkadotSigningRequestProvider signingRequest={signingRequest}>
          <PolkadotSignMessageRequest />
        </PolkadotSigningRequestProvider>
      )
    default:
      throw new Error("Unknown signing request type")
  }
}
