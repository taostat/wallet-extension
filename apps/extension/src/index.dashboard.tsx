import "@common/enableAnyloggerLogsInDevelopment"
import "@common/i18nConfig"
import "@common/zodConfig"

import { renderApp } from "@ui"
import Dashboard from "@ui/apps/dashboard"

renderApp(<Dashboard />)
