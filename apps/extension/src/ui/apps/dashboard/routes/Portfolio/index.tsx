import { NavigateWithQuery } from "@taostats/components/NavigateWithQuery"
import { Route, Routes } from "react-router-dom"

import { DashboardLayout } from "@ui/apps/dashboard/layout"
import { DashboardPortfolioHeader } from "@ui/domains/Portfolio/DashboardPortfolioHeader"
import { PortfolioContainer } from "@ui/domains/Portfolio/PortfolioContainer"
import { PortfolioToolbarTokens } from "@ui/domains/Portfolio/PortfolioToolbarTokens"

import { PortfolioAsset, PortfolioAssetHeader } from "./PortfolioAsset"
import { PortfolioAssets } from "./PortfolioAssets"
import { PortfolioLayout } from "./Shared/PortfolioLayout"

export const PortfolioRoutes = () => (
  <PortfolioContainer>
    <DashboardLayout sidebar="accounts">
      {/* share layout to prevent tabs flickering */}
      <PortfolioLayout toolbar={<PortfolioToolbar />} header={<PortfolioHeader />}>
        <Routes>
          <Route path="tokens/:netuid" element={<PortfolioAsset />} />
          <Route path="tokens" element={<PortfolioAssets />} />
          <Route path="*" element={<NavigateWithQuery url="tokens" />} />
        </Routes>
      </PortfolioLayout>
    </DashboardLayout>
  </PortfolioContainer>
)

const PortfolioToolbar = () => {
  return (
    <Routes>
      <Route path="tokens" element={<PortfolioToolbarTokens />} />
    </Routes>
  )
}

const PortfolioHeader = () => (
  <Routes>
    <Route path="tokens/:netuid" element={<PortfolioAssetHeader />} />
    <Route path="*" element={<DashboardPortfolioHeader />} />
  </Routes>
)
