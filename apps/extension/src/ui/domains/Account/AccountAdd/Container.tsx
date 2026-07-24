import { AnnotationDots } from "@untitledui/icons/AnnotationDots"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { Eye } from "@untitledui/icons/Eye"
import { FilePlus01 } from "@untitledui/icons/FilePlus01"
import { Link01 } from "@untitledui/icons/Link01"
import { useTranslation } from "react-i18next"
import { CtaButton } from "taostats-ui"

import { TaostatsIcon } from "@taostats/theme/logos"
import { getIsLedgerCapable } from "@ui/util/getIsLedgerCapable"

import { useAccountCreateContext } from "./context"

const methodButtonsFromMethodType = {
  new: NewAccountMethodButtons,
  connect: ConnectAccountMethodButtons,
}

export const AccountCreateContainer = ({ className }: { className?: string }) => {
  const { methodType } = useAccountCreateContext()
  const MethodButtonsComponent = methodButtonsFromMethodType[methodType] ?? null

  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <MethodButtonsComponent />
      </div>
    </div>
  )
}

function NewAccountMethodButtons() {
  const { t } = useTranslation()
  const isLedgerCapable = getIsLedgerCapable()

  return (
    <>
      <CtaButton
        iconLeft={TaostatsIcon}
        iconRight={ChevronRight}
        title={t("New Bittensor Account")}
        subtitle={t("New Bittensor Account")}
        to="/accounts/add/derived?platform=polkadot"
      />
      <CtaButton
        iconLeft={AnnotationDots}
        iconRight={ChevronRight}
        title={t("Import via Recovery Phrase")}
        subtitle={t("Import with 12 or 24 word recovery phrase")}
        to="/accounts/add/mnemonic"
      />
      <CtaButton
        iconLeft={FilePlus01}
        iconRight={ChevronRight}
        title={t("Import via JSON")}
        subtitle={t("Import your Polkadot.{js} file")}
        to="/accounts/add/json"
      />
      <CtaButton
        iconLeft={Eye}
        iconRight={ChevronRight}
        title={t("Import Read-only Wallet")}
        subtitle={t("Watch an existing Bittensor account")}
        to="/accounts/add/watched?platform=polkadot"
      />
      <CtaButton
        iconLeft={Link01}
        iconRight={ChevronRight}
        title={t("Connect Ledger")}
        subtitle={
          isLedgerCapable ? t("Connect your ledger") : t("Not supported on this browser")
        }
        disabled={!isLedgerCapable}
        to="/accounts/add/ledger"
      />
    </>
  )
}

function ConnectAccountMethodButtons() {
  const { t } = useTranslation()
  const isLedgerCapable = getIsLedgerCapable()

  return (
    <CtaButton
      iconLeft={Link01}
      iconRight={ChevronRight}
      title={t("Connect Ledger")}
      subtitle={isLedgerCapable ? t("Connect your ledger") : t("Not supported on this browser")}
      disabled={!isLedgerCapable}
      to="/accounts/add/ledger"
    />
  )
}
