import { PolkadotVaultIcon, SignetIcon, UsbIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { Eye } from "@untitledui/icons/Eye"
import { Link01 } from "@untitledui/icons/Link01"
import { Users01 } from "@untitledui/icons/Users01"
import { AccountType } from "extension-core"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

type AccountTypeIconProps = {
  type?: AccountType | null
  showLinked?: boolean
  className?: string
  signetUrl?: string
}

export const AccountTypeIcon: FC<AccountTypeIconProps> = ({
  type,
  showLinked,
  className,
  signetUrl,
}) => {
  const { t } = useTranslation()

  const [Icon, tooltip] = useMemo(() => {
    if (!type) return [undefined, undefined]

    if (!!showLinked && type === "keypair") return [Link01, t("Local account")]
    if (["ledger-ethereum", "ledger-polkadot", "ledger-solana"].includes(type))
      return [UsbIcon, t("Ledger account")]
    if (type === "polkadot-vault") return [PolkadotVaultIcon, t("Polkadot Vault account")]
    if (type === "watch-only") return [Eye, t("Watched account")]
    if (type === "contact") return [Users01, t("Contact")]
    if (type === "signet")
      return [SignetIcon, t(`Signet Vault${signetUrl !== undefined ? `: ${signetUrl}` : ""}`)]

    return [undefined, undefined]
  }, [type, showLinked, signetUrl, t])

  if (!origin || !Icon) return null

  // wrap icon with a span as tooltip trigger needs a ref to it's children
  return (
    <Tooltip>
      <TooltipTrigger asChild className="flex flex-col justify-center">
        <span>
          <Icon className={classNames(className)} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
