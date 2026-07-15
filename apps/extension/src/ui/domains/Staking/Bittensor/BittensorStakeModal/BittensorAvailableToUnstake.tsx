import { TokensAndFiat } from "@ui/domains/Asset/TokensAndFiat"

import { useBittensorStakeWizard } from "../hooks/useBittensorStakeWizard"

export const BittensorAvailableToUnstake = () => {
  const { dtaoToken, dtaoBalance } = useBittensorStakeWizard()

  return (
    <div className="text-fg-secondary flex items-center gap-2">
      <TokensAndFiat
        planck={dtaoBalance?.free.planck}
        tokenId={dtaoToken?.id}
        noCountUp
        tokensClassName="text-fg-primary"
      />
    </div>
  )
}
