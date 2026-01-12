import { provideContext } from "@taostats/util/provideContext"
import { FC, ReactNode } from "react"

import { RiskAnalysisDrawers } from "./RiskAnalysisDrawers"
import { RiskAnalysis } from "./types"

type RisksAnalysisProviderProps = {
  riskAnalysis?: RiskAnalysis
}

const useRisksAnalysisProvider = ({ riskAnalysis }: RisksAnalysisProviderProps) => {
  return riskAnalysis
}

const [RiskAnalysisProviderInner, useRiskAnalysis] = provideContext(useRisksAnalysisProvider)

export const RiskAnalysisProvider: FC<
  RisksAnalysisProviderProps & { children: ReactNode; onReject?: () => void }
> = ({ riskAnalysis, children, onReject }) => {
  return (
    <RiskAnalysisProviderInner riskAnalysis={riskAnalysis}>
      {children}
      <RiskAnalysisDrawers riskAnalysis={riskAnalysis} onReject={onReject} />
    </RiskAnalysisProviderInner>
  )
}

export { useRiskAnalysis }
