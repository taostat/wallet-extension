import { Navigate, Route, Routes } from "react-router-dom"

import { DashboardLayout } from "@ui/apps/dashboard/layout"
import { EditNetworkPage } from "@ui/apps/dashboard/routes/Networks/EditNetworkPage"
import { NetworksPage } from "@ui/apps/dashboard/routes/Networks/NetworksPage"
import { EditTokenPage } from "@ui/apps/dashboard/routes/Tokens/EditTokenPage"
import { TokensPage } from "@ui/apps/dashboard/routes/Tokens/TokensPage"

import { AboutPage } from "./AboutPage"
import { AccountsPage } from "./Accounts"
import { AddressBookPage } from "./AddressBookPage"
import { AnalyticsOptInPage } from "./AnalyticsOptInPage"
import { AutoLockTimerPage } from "./AutoLockTimerPage"
import { ChangePasswordPage } from "./ChangePasswordPage"
import { ConnectedSitesPage } from "./ConnectedSitesPage"
import { GeneralPage } from "./GeneralPage"
import { LanguagePage } from "./LanguagePage"
import { MnemonicsPage } from "./Mnemonics/MnemonicsPage"
import { NetworksTokensPage } from "./NetworksTokensPage"
import { SecurityPrivacyPage } from "./SecurityPrivacyPage"

/** Persistent layout so the settings sidebar stays mounted across page changes (enables nav transitions). */
export const SettingsRoutes = () => (
  <DashboardLayout sidebar="settings">
    <Routes>
      <Route path="" element={<Navigate to="general" replace />} />
      <Route path="general">
        <Route path="" element={<GeneralPage />} />
        <Route path="language" element={<LanguagePage />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
      <Route path="address-book" element={<AddressBookPage />} />
      <Route path="connected-sites" element={<ConnectedSitesPage />} />
      <Route path="mnemonics" element={<MnemonicsPage />} />
      <Route path="accounts" element={<AccountsPage />} />
      <Route path="security-privacy-settings">
        <Route path="" element={<SecurityPrivacyPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="autolock" element={<AutoLockTimerPage />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
      <Route path="networks-tokens">
        <Route path="" element={<NetworksTokensPage />} />
        <Route path="tokens">
          <Route path="" element={<TokensPage />} />
          <Route path=":id" element={<EditTokenPage />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
        <Route path="networks">
          <Route path="" element={<NetworksPage />} />
          <Route
            path="ethereum"
            element={
              <Navigate to="/settings/networks-tokens/networks" replace state={{ platform: "ethereum" }} />
            }
          />
          <Route
            path="polkadot"
            element={
              <Navigate to="/settings/networks-tokens/networks" replace state={{ platform: "polkadot" }} />
            }
          />
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
        <Route path="network/:id" element={<EditNetworkPage />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
      <Route path="about" element={<AboutPage />} />
      <Route path="analytics" element={<AnalyticsOptInPage />} />
      <Route
        path="change-password"
        element={<Navigate to="/settings/security-privacy-settings/change-password" replace />}
      />
      <Route
        path="autolock"
        element={<Navigate to="/settings/security-privacy-settings/autolock" replace />}
      />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  </DashboardLayout>
)
