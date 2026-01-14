import { ChainIcon, InfoIcon, PlusIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { isAccountPlatformCompatibleWithNetwork } from "extension-core"
import { cloneElement, ReactElement, ReactNode, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { AllNetworksLogoStack } from "@ui/domains/Account/AllNetworksLogoStack"
import { useNetworks } from "@ui/state"
import { getIsLedgerCapable } from "@ui/util/getIsLedgerCapable"

import { MethodType, useAccountCreateContext } from "./context"

const methodButtonsFromMethodType = {
  new: NewAccountMethodButtons,
  connect: ConnectAccountMethodButtons,
}

export const AccountCreateContainer = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const { methodType } = useAccountCreateContext()
  const MethodButtonsComponent = methodButtonsFromMethodType[methodType] ?? null

  return (
    <div className={classNames("justify-left flex flex-col gap-8", className)}>
      <div className="flex overflow-auto">
        <MethodTypeTab
          icon={<PlusIcon />}
          title={t("Add")}
          subtitle={t("Add or watch an account")}
          methodType="new"
        />
        <MethodTypeTab
          icon={<ChainIcon />}
          title={t("Connect")}
          subtitle={t("Ledger, Polkadot Vault, etc")}
          methodType="connect"
        />
      </div>
      <div className="border-grey-750 -mt-8 grid grid-cols-2 items-start gap-8 rounded rounded-tl-none border p-10">
        <MethodButtonsComponent />
      </div>
    </div>
  )
}

function MethodTypeTab({
  className,
  icon,
  title,
  subtitle,
  methodType,
}: {
  className?: string
  icon: ReactElement
  title: ReactNode
  subtitle: ReactNode
  methodType: MethodType
}) {
  const { methodType: selectedMethodType, setMethodType } = useAccountCreateContext()
  const isSelected = selectedMethodType === methodType

  return (
    <button
      type="button"
      className={classNames(
        "flex items-center justify-start gap-4 rounded-t border border-b-0 border-transparent p-6 opacity-70 lg:flex-grow lg:[&:last-of-type]:rounded-br",
        "focus:bg-grey-750 hover:bg-grey-750 focus:border-grey-750 hover:border-grey-750 hover:opacity-100 focus:opacity-100",
        isSelected && "border-grey-750 bg-grey-850 opacity-100",
        className,
      )}
      onClick={(e) => (setMethodType(methodType), e.currentTarget.blur())}
    >
      <div className="text-primary text-lg">{cloneElement(icon, { className: "stroke-1" })}</div>
      <div
        className={classNames(
          "hidden flex-col items-start justify-start gap-2 lg:flex",
          isSelected && "flex",
        )}
      >
        <div className="text-base font-bold">{title}</div>
        <div className="text-body-secondary whitespace-pre text-xs">{subtitle}</div>
      </div>
    </button>
  )
}

function NewAccountMethodButtons() {
  const { t } = useTranslation()

  return (
    <>
      <AccountTypeMethodButton
        title={
          <SelectAccountTypeButtonHeader
            title={t("New Bittensor Account")}
            tooltip={t("Continue to create your new Bittensor account")}
          />
        }
        to={`/accounts/add/derived?platform=polkadot`}
      />
      <AccountCreateMethodButton
        title={t("Import via Recovery Phrase")}
        subtitle={t("Import your Bittensor account")}
        to={`/accounts/add/mnemonic`}
      />
      <AccountTypeMethodButton
        title={
          <SelectAccountTypeButtonHeader
            title={t("Watch Bittensor Account")}
            tooltip={t("Continue to watch an existing Bittensor account")}
          />
        }
        to={`/accounts/add/watched?platform=polkadot`}
        isWatchSection
      />
    </>
  )
}

function ConnectAccountMethodButtons() {
  const { t } = useTranslation()
  const isLedgerCapable = getIsLedgerCapable()

  return (
    <>
      <AccountCreateMethodButton
        title={t("Connect Ledger")}
        subtitle={
          isLedgerCapable
            ? t("Connect your ledger to your Bittensor account")
            : t("Not supported on this browser")
        }
        disabled={!isLedgerCapable}
        to={`/accounts/add/ledger`}
      />
    </>
  )
}

function SelectAccountTypeButtonHeader({ title, tooltip }: { title: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-3">
      {title}
      <Tooltip placement="bottom">
        <TooltipTrigger asChild>
          <div>
            <InfoIcon className="text-sm" />
          </div>
        </TooltipTrigger>
        {!!tooltip && (
          <TooltipContent>
            <div>{tooltip}</div>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}

function AccountTypeMethodButton({
  title,
  disabled,
  to,
  supportedNetworks,
  isWatchSection = false,
}: {
  title: ReactNode
  disabled?: boolean
  to?: string
  supportedNetworks?: ReactNode
  isWatchSection?: boolean
}) {
  const { t } = useTranslation()

  return (
    <AccountCreateMethodButton
      title={title}
      subtitle={
        supportedNetworks ?? (
          <div className="flex items-center gap-2">
            <div>
              {isWatchSection
                ? t("Click here to watch en existing Bittensor account")
                : t("Click here to create your new Bittensor account")}
            </div>
          </div>
        )
      }
      to={to}
      disabled={disabled}
    />
  )
}

function AccountCreateMethodButton({
  title,
  subtitle,
  disabled,
  to,
}: {
  title: ReactNode
  subtitle: ReactNode
  disabled?: boolean
  to?: string
}) {
  const navigate = useNavigate()
  const handleClick = useCallback(() => to !== undefined && navigate(to), [navigate, to])

  const getNetworks = useNetworks()

  const supportedChainIds = useMemo(
    () =>
      getNetworks
        .filter((n) => isAccountPlatformCompatibleWithNetwork(n, "polkadot"))
        .map((n) => n.id),
    [getNetworks],
  )

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={classNames(
        "relative flex flex-col gap-12 rounded bg-white/5 p-10",
        disabled && "text-body-secondary opacity-40",
        !disabled && "text-body cursor-pointer hover:bg-white/10 focus:bg-white/10",
      )}
    >
      <span className="w-full pb-3 text-start">{title}</span>
      <span className="text-body-secondary flex items-center gap-2 pr-8 text-sm">
        <AllNetworksLogoStack className="text-md" ids={supportedChainIds} max={5} />
        <span className="text-xs">{subtitle}</span>
      </span>
    </button>
  )
}
