import Transport from "@ledgerhq/hw-transport"
import TransportWebHID from "@ledgerhq/hw-transport-webhid"
import TransportWebUSB from "@ledgerhq/hw-transport-webusb"
import { classNames, isNotNil } from "@taostats-wallet/util"
import { Bell03 } from "@untitledui/icons/Bell03"
import { Check } from "@untitledui/icons/Check"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { Code02 } from "@untitledui/icons/Code02"
import { CoinsStacked01 } from "@untitledui/icons/CoinsStacked01"
import { CoinsStacked02 } from "@untitledui/icons/CoinsStacked02"
import { Dataflow01 } from "@untitledui/icons/Dataflow01"
import { EyeOff } from "@untitledui/icons/EyeOff"
import { RefreshCcw01 } from "@untitledui/icons/RefreshCcw01"
import { Translate01 } from "@untitledui/icons/Translate01"
import { X } from "@untitledui/icons/X"
import { LedgerTransportType } from "extension-core"
import { log } from "extension-shared"
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, CtaButton, Dropdown, Modal, ModalDialog, Toggle } from "taostats-ui"

import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Setting } from "@taostats/components/Setting"
import { AnalyticsPage } from "@ui/api/analytics"
import { useRuntimeReload } from "@ui/hooks/useRuntimeReload"
import { useSetting } from "@ui/state"
import { getIsLedgerCapable } from "@ui/util/getIsLedgerCapable"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Settings",
  featureVersion: 1,
  page: "General",
}

export const GeneralPage = () => <Content />

const Content = () => {
  const { t } = useTranslation()
  const [hideBalances, setHideBalances] = useSetting("hideBalances")
  const [hideDust, setHideDust] = useSetting("hideDust")
  const [leaveDustOnMaxSendTao, setLeaveDustOnMaxSendTao] = useSetting("leaveDustOnMaxSendTao")
  const [allowNotifications, setAllowNotifications] = useSetting("allowNotifications")
  const [hasRuntimeReloadFn, runtimeReload] = useRuntimeReload(ANALYTICS_PAGE)
  const [developerMode, setDeveloperMode] = useSetting("developerMode")

  return (
    <>
      <HeaderBlock title={t("General Settings")} text={t("Organise and sort your accounts")} />
      <div className="mt-8 flex flex-col gap-2">
        {hasRuntimeReloadFn ? (
          <Setting
            iconLeft={RefreshCcw01}
            title={t("Reload Taostats Wallet")}
            subtitle={t("Close and restart the wallet, this sometimes helps fix errors")}
          >
            <Button color="brand" small onClick={runtimeReload}>
              {t("Reload")}
            </Button>
          </Setting>
        ) : null}
        <Setting
          iconLeft={Bell03}
          title={t("Allow notifications")}
          subtitle={t("Allow notifications about transaction progress")}
        >
          <Toggle
            checked={allowNotifications}
            onChange={(e) => setAllowNotifications(e.target.checked)}
          />
        </Setting>
        <Setting
          iconLeft={EyeOff}
          title={t("Blur balances")}
          subtitle={t("Conceal your portfolio and account balances")}
        >
          <Toggle checked={hideBalances} onChange={(e) => setHideBalances(e.target.checked)} />
        </Setting>
        <Setting
          iconLeft={CoinsStacked01}
          title={t("Hide small balances")}
          subtitle={t("Hide tokens with a balance below US$1")}
        >
          <Toggle checked={hideDust} onChange={(e) => setHideDust(e.target.checked)} />
        </Setting>
        <Setting
          iconLeft={CoinsStacked02}
          title={t("Leave dust")}
          subtitle={t("When pressing the Max button when sending Tao, leave 0.01 Tao behind")}
        >
          <Toggle
            checked={leaveDustOnMaxSendTao}
            onChange={(e) => setLeaveDustOnMaxSendTao(e.target.checked)}
          />
        </Setting>
        <CtaButton
          iconLeft={Translate01}
          iconRight={ChevronRight}
          title={t("Language")}
          subtitle={t("Change the wallet display language")}
          to={`/settings/general/language`}
        />
        <Setting
          iconLeft={Dataflow01}
          title={t("Ledger interface")}
          subtitle={t("Select which connection type to use with Ledger hardware wallets")}
        >
          <LedgerTransportTypeSelect />
        </Setting>
        <Setting
          iconLeft={Code02}
          title={t("Developer mode")}
          subtitle={t("Allow connecting to dapps with watch-only accounts")}
        >
          <Toggle checked={developerMode} onChange={(e) => setDeveloperMode(e.target.checked)} />
        </Setting>
      </div>
    </>
  )
}

type LedgerTransportStatusCheck = { ok: true } | { ok: false; error: string }

export const LedgerTransportTypeSelect = () => {
  const { t } = useTranslation()
  const [ledgerTransportType, setLedgerTransportType] = useSetting("ledgerTransportType")
  const refTransport = useRef<Transport | null>(null)
  const [checkStatus, setCheckStatus] = useState<LedgerTransportStatusCheck>()

  const ledgerTransportTypeItems = useMemo(
    () =>
      [
        getIsLedgerCapable("hid") ? { value: "hid", label: t("HID") } : null,
        getIsLedgerCapable("usb") ? { value: "usb", label: t("USB") } : null,
      ].filter(isNotNil) as { value: LedgerTransportType; label: string }[],
    [t],
  )

  const ledgerTransportTypeValue = useMemo(() => {
    return (
      ledgerTransportTypeItems.find((item) => item.value === ledgerTransportType) ||
      ledgerTransportTypeItems[0]
    )
  }, [ledgerTransportType, ledgerTransportTypeItems])

  const checkConnectivity = useCallback(async () => {
    try {
      await refTransport.current?.close()

      switch (ledgerTransportType) {
        case "hid":
          refTransport.current = await TransportWebHID.create()
          setCheckStatus({ ok: true })
          break
        case "usb":
          refTransport.current = await TransportWebUSB.create()
          setCheckStatus({ ok: true })
          break
      }
    } catch (err) {
      setCheckStatus({ ok: false, error: (err as Error).message })
    }
  }, [ledgerTransportType])

  useEffect(() => {
    return () => {
      refTransport.current?.close().catch((err) => {
        log.error("Failed to close transport on unmount", { err })
      })
    }
  }, [])

  if (ledgerTransportTypeItems.length === 0)
    return <div className="text-fg-disabled text-right">{t("Unavailable")}</div>

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        small
        items={ledgerTransportTypeItems}
        propertyKey="value"
        value={ledgerTransportTypeValue}
        onChange={(v) => setLedgerTransportType(v!.value)}
        renderItem={(item) => item.label}
      />
      <Button color="brand" small onClick={checkConnectivity}>
        {t("Check")}
      </Button>
      <Modal isOpen={!!checkStatus} onDismiss={() => setCheckStatus(undefined)}>
        <LedgerTransportCheckModalDialog
          status={checkStatus}
          transport={ledgerTransportType}
          onClose={() => setCheckStatus(undefined)}
        />
      </Modal>
    </div>
  )
}

const LedgerTransportCheckModalDialog: FC<{
  status?: LedgerTransportStatusCheck
  transport: LedgerTransportType
  onClose: () => void
}> = ({ status, transport, onClose }) => {
  const { t } = useTranslation()
  const [prevStatus, setPrevStatus] = useState<LedgerTransportStatusCheck>()

  useEffect(() => {
    // keep in state to avoid flickering while closing the modal
    if (status) setPrevStatus(status)
  }, [status])

  const s = status ?? prevStatus

  if (!s) return null

  return (
    <ModalDialog title={t("Ledger connectivity check")} onClose={onClose}>
      <div className="flex w-full items-center gap-3">
        <div
          className={classNames(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            s.ok
              ? "text-fg-success bg-brand-secondary/10"
              : "text-fg-orange bg-orange-secondary/10",
          )}
        >
          {s.ok ? <Check className="size-6" /> : <X className="size-6" />}
        </div>
        <div className="grow">
          <p className="text-fg-primary">
            {s.ok
              ? t("{{transport}} connection successful", {
                  transport: transport.toUpperCase(),
                })
              : t("{{transport}} connection failed: {{error}}", {
                  error: s.error,
                  transport: transport.toUpperCase(),
                })}
          </p>
        </div>
      </div>
      {!s.ok && (
        <p className="text-fg-secondary mt-4">
          {t(
            "You may need to reload this page before being able to try again, some browsers prevent multiple {{transport}} connection attempts.",
            { transport: transport.toUpperCase() },
          )}
        </p>
      )}

      <div className="mt-6 flex w-full justify-end gap-4">
        {!s.ok && (
          <Button
            onClick={() => {
              window.location.href = window.location.href.toString()
            }}
          >
            {t("Reload")}
          </Button>
        )}
        <Button primary onClick={onClose}>
          {t("Close")}
        </Button>
      </div>
    </ModalDialog>
  )
}
