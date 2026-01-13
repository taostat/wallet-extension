import "@common/enableAnyloggerLogsInDevelopment"
import "@common/i18nConfig"
import "@common/zodConfig"

import { renderApp } from "@ui"
import Onboarding from "@ui/apps/onboard"

renderApp(<Onboarding />, { keepWalletUnlockedMode: "always" })
