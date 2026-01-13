import "@common/enableAnyloggerLogsInDevelopment"
import "@common/i18nConfig"

import { renderApp } from "@ui"
import { SupportOpsPage } from "@ui/apps/support"

renderApp(<SupportOpsPage />, { keepWalletUnlockedMode: "always" })
