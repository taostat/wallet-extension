import { FC } from "react"

import { AssetLogo } from "@ui/domains/Asset/AssetLogo"
import { useToken } from "@ui/state"

export const TokenLogo: FC<{
  tokenId?: string
  className?: string
}> = ({ className, tokenId }) => {
  const token = useToken(tokenId)

  return <AssetLogo tokenId={tokenId} url={token?.logo} className={className} />
}
