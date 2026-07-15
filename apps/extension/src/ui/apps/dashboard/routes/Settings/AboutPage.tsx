import { HelpCircle } from "@untitledui/icons/HelpCircle"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { LinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { DISCORD_URL } from "extension-shared"
import { useTranslation } from "react-i18next"
import { CtaButton } from "taostats-ui"

import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { DashboardLayout } from "@ui/apps/dashboard/layout"

const Content = () => {
  const { t } = useTranslation()
  return (
    <>
      <HeaderBlock title={t("About")} />
      <div className="mt-6 flex flex-col gap-4">
        <div className="bg-secondary text-fg-disabled flex w-full items-start gap-8 rounded-sm p-8">
          <InfoCircle className={"text-fg-primary shrink-0 text-lg"} />
          <div className={"flex grow flex-col items-start gap-4"}>
            <div className={"text-fg-primary text-base"}>Open Source Attribution</div>
            <div className={"text-fg-secondary text-left text-sm"}>
              Taostats Wallet is a modified fork of the Talisman Wallet. <br />
              <br />
              Copyright © Talisman Wallet Contributors <br />
              <br />
              Source code: <br />
              <div className="mt-2 flex flex-row justify-start gap-4">
                <LinkToGithub href="https://github.com/taostat/wallet-extension">
                  Taostats
                </LinkToGithub>
                <LinkToGithub href="https://github.com/TalismanSociety/talisman">
                  Talisman
                </LinkToGithub>
              </div>
              <br />
              Website:{" "}
              <a
                href="https://talisman.xyz"
                target="_blank"
                rel="noreferrer"
                className="text-fg-brand"
              >
                Talisman
              </a>
              <br />
              <br />
              License: <br />
              GNU General Public License v3.0 (GPLv3)
              <br />
              <br />
              This version has been modified and extended by Taostats / T34 Corporation FZCO.
            </div>
          </div>
        </div>

        <CtaButton
          title={t("Help and Support")}
          subtitle={t("For help and support please visit our Discord")}
          to={DISCORD_URL}
          iconLeft={HelpCircle}
          iconRight={LinkExternal01}
        />
      </div>
    </>
  )
}

const LinkToGithub = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-fg-secondary border-primary hover:text-fg-primary hover:bg-secondary group flex items-center justify-between gap-2 rounded-sm border p-4 transition-all duration-300"
    >
      {children}
      <LinkExternal01 className="text-fg-secondary group-hover:text-fg-primary shrink-0 transition-all duration-300" />
    </a>
  )
}

export const AboutPage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)
