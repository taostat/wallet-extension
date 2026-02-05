import { SigningRequests } from "../domains/signing/types"

export const isSigningType = <T extends keyof SigningRequests>(
  signingRequest: SigningRequests[T][0],
  type: T,
) => {
  return signingRequest.type === type
}
