import { PHISHING_PAGE_REDIRECT } from "@polkadot/extension-base/defaults"
import { DEBUG } from "extension-shared"
import { FC, PropsWithChildren, Suspense, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, Route, Routes, useMatch } from "react-router-dom"

import { FullScreenLocked } from "@taostats/components/FullScreenLocked"
import { NavigateWithQuery } from "@taostats/components/NavigateWithQuery"
import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { api } from "@ui/api"
import { DatabaseErrorAlert } from "@ui/domains/Settings/DatabaseErrorAlert"
import { MigrationProgress } from "@ui/domains/System/MigrationProgress"
import { useLoginCheck } from "@ui/hooks/useLoginCheck"

import { AccountAddMenu } from "./routes/AccountAdd"
import { AccountAddDcentDashboardWizard } from "./routes/AccountAdd/AccountAddDcentWizard"
import { AccountAddDerivedPage } from "./routes/AccountAdd/AccountAddDerivedPage"
import { AccountAddJsonPage } from "./routes/AccountAdd/AccountAddJsonPage"
import { AccountAddLedgerDashboardWizard } from "./routes/AccountAdd/AccountAddLedgerWizard"
import { AccountAddMnemonicDashboardWizard } from "./routes/AccountAdd/AccountAddMnemonicWizard"
import { AccountAddQrDashboardWizard } from "./routes/AccountAdd/AccountAddQrWizard"
import { AccountAddSignetDashboardWizard } from "./routes/AccountAdd/AccountAddSignetWizard"
import { AccountAddWatchedPage } from "./routes/AccountAdd/AccountAddWatchedPage"
import { PhishingPage } from "./routes/PhishingPage"
import { PortfolioRoutes } from "./routes/Portfolio"
import { SettingsRoutes } from "./routes/Settings"
import { TestPage } from "./routes/TestPage"
import { TxHistory } from "./routes/TxHistory"

const DashboardInner = () => {
  return (
    <Suspense fallback={<SuspenseTracker name="Dashboard" />}>
      <Routes>
        <Route path="portfolio/*" element={<PortfolioRoutes />} />
        <Route path="tx-history/*" element={<TxHistory />} />
        <Route path="accounts">
          <Route path="add">
            <Route index element={<AccountAddMenu />} />
            <Route path="derived" element={<AccountAddDerivedPage />} />
            <Route path="json" element={<AccountAddJsonPage />} />
            <Route path="mnemonic/*" element={<AccountAddMnemonicDashboardWizard />} />
            <Route path="ledger/*" element={<AccountAddLedgerDashboardWizard />} />
            <Route path="qr/*" element={<AccountAddQrDashboardWizard />} />
            <Route path="watched" element={<AccountAddWatchedPage />} />
            <Route path="dcent/*" element={<AccountAddDcentDashboardWizard />} />
            <Route path="signet/*" element={<AccountAddSignetDashboardWizard />} />
            <Route path="*" element={<Navigate to="/accounts/add" replace />} />
          </Route>
          <Route path="" element={<NavigateWithQuery url="/portfolio" replace />} />
        </Route>
        <Route path="settings/*" element={<SettingsRoutes />} />
        {/* Old routes redirects */}
        <Route
          path="networks"
          element={<Navigate to="/settings/networks-tokens/networks" replace />}
        />
        <Route path="tokens" element={<Navigate to="/settings/networks-tokens/tokens" replace />} />
        {DEBUG && <Route path="test" element={<TestPage />} />}
        <Route path="*" element={<NavigateWithQuery url="/portfolio" replace />} />
      </Routes>
    </Suspense>
  )
}

const PreventPhishing: FC<PropsWithChildren> = ({ children }) => {
  const match = useMatch(`${PHISHING_PAGE_REDIRECT}/:url`)

  if (match?.params?.url) return <PhishingPage url={match.params.url} />

  return <>{children}</>
}

const LoginChecker: FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation()
  const { isLoggedIn, isOnboarded, isMigrating } = useLoginCheck()
  const wasLoggedIn = useRef(false)

  useEffect(() => {
    if (isLoggedIn) wasLoggedIn.current = true
  }, [isLoggedIn])

  // if we're not onboarded, redirect to onboard
  useEffect(() => {
    if (!isOnboarded) {
      window.location.href = window.location.href.replace("dashboard.html", "onboarding.html")
    } else if (!isLoggedIn) {
      // if user was logged in and locked the extension from the popup, close the tab
      if (wasLoggedIn.current) window.close()
      // else (open from a bookmark?), prompt login
      else api.promptLogin()
    }
  }, [isLoggedIn, isOnboarded])

  if (!isLoggedIn)
    return <FullScreenLocked title={t("Waiting")} subtitle={t("Unlock Taostats Wallet")} />

  if (isMigrating) return <MigrationProgress />

  return <>{children}</>
}

const Dashboard = () => (
  <PreventPhishing>
    <LoginChecker>
      <DashboardInner />
    </LoginChecker>
    <DatabaseErrorAlert container="fullscreen" />
  </PreventPhishing>
)

export default Dashboard
