import { ExternalLinkIcon, HelpCircleIcon, InfoIcon } from "@taostats-wallet/icons"
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
        <div className="bg-grey-850 text-body-disabled flex w-full items-start gap-8 rounded-sm p-8">
          <InfoIcon className={"text-body shrink-0 text-lg"} />
          <div className={"flex grow flex-col items-start gap-4"}>
            <div className={"text-body text-base"}>Open Source Attribution</div>
            <div className={"text-body-secondary text-left text-sm"}>
              We believe{" "}
              <a
                href="https://talisman.xyz/features/"
                target="_blank"
                rel="noreferrer"
                className="text-primary"
              >
                Talisman
              </a>{" "}
              is among the best and most secure self-custody wallets available. We're grateful to
              the Talisman contributors for building such a strong open-source foundation. <br />
              <br />
              This wallet is built on the open-source Talisman Wallet and has been adapted for the
              Bittensor ecosystem with additional Taostats-specific features.
            </div>
            <div
              className={"text-body-secondary bg-grey-800 w-full rounded-sm p-4 text-left text-sm"}
            >
              Both projects are licensed under the GNU General Public License v3.0 (GPLv3). Source
              code is available at:
              <div className="mt-4 flex flex-row justify-start gap-4">
                <LinkToGithub href="https://github.com/taostats/wallet-extension">
                  Taostats
                </LinkToGithub>
                <LinkToGithub href="https://github.com/TalismanSociety/talisman">
                  Talisman
                </LinkToGithub>
              </div>
            </div>
          </div>
        </div>

        <CtaButton
          title={t("Help and Support")}
          subtitle={t("For help and support please visit our Discord")}
          to={DISCORD_URL}
          iconLeft={HelpCircleIcon}
          iconRight={ExternalLinkIcon}
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
      className="text-body-secondary border-body-secondary hover:text-body hover:bg-grey-850 group flex items-center justify-between gap-2 rounded-sm border p-4 transition-all duration-300"
    >
      {children}
      <ExternalLinkIcon className="text-body-secondary group-hover:text-body shrink-0 transition-all duration-300" />
    </a>
  )
}

export const AboutPage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)
