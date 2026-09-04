import { classNames } from "@taostats-wallet/util"
import { Account, isAccountOfType } from "extension-core"
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, FormFieldContainer, FormFieldInputText } from "taostats-ui"

import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
import { api } from "@ui/api"
import { AccountIcon } from "@ui/domains/Account/AccountIcon"
import { PasswordUnlock, usePasswordUnlock } from "@ui/domains/Account/PasswordUnlock"
import { TextQrCode, QR_BRAND_COLOR } from "@ui/domains/CopyAddress/TextQrCode"
import { useAccounts } from "@ui/state"

type Step = "explainer" | "pin1" | "pin2" | "pin3" | "account" | "unlock" | "qr"

const GROUP_COUNT = 3
const TTL_MS = 5 * 60 * 1000

const Stepper: FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="mb-6 flex items-center gap-2" aria-label={`Step ${current} of ${total}`}>
    {Array.from({ length: total }, (_, index) => {
      const step = index + 1
      return (
        <div
          key={step}
          className={classNames(
            "h-1 flex-1 rounded-full",
            step === current ? "bg-fg-brand" : "bg-secondary",
          )}
        />
      )
    })}
  </div>
)

const ExplainerStep: FC<{ onContinue: () => void }> = ({ onContinue }) => {
  const { t } = useTranslation()
  return (
    <>
      <HeaderBlock
        title={t("Generate QR code for Taostats App Import")}
        text={t(
          "This QR code is only for importing an account into the Taostats mobile app. It is not a general wallet backup and does not include a recovery phrase.",
        )}
      />
      <Spacer />
      <div className="bg-secondary text-fg-secondary rounded-md p-4 text-sm">
        {t(
          "On your phone, open Import from Taostats Wallet, then enter the import code shown there into this extension. The QR code will expire after 5 minutes.",
        )}
      </div>
      <Spacer />
      <Button className="w-full" primary onClick={onContinue}>
        {t("Continue")}
      </Button>
    </>
  )
}

const PinGroupStep: FC<{
  groupIndex: number
  value: string
  onChange: (value: string) => void
  onBack: () => void
  onContinue: () => void
}> = ({ groupIndex, value, onChange, onBack, onContinue }) => {
  const { t } = useTranslation()
  const canContinue =
    value.replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz]/g, "").length === 3

  return (
    <>
      <Stepper current={groupIndex + 1} total={GROUP_COUNT} />
      <HeaderBlock
        title={t("Enter import code ({{current}} of {{total}})", {
          current: groupIndex + 1,
          total: GROUP_COUNT,
        })}
        text={t("Enter the group of 3 characters shown in the Taostats app.")}
      />
      <Spacer />
      <FormFieldContainer>
        <FormFieldInputText
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          autoComplete="off"
          spellCheck={false}
          maxLength={5}
          placeholder="XXX"
          className="text-center font-mono text-2xl tracking-[0.35em]"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canContinue) onContinue()
          }}
        />
      </FormFieldContainer>
      <Spacer />
      <div className="flex gap-2">
        <Button className="w-full" onClick={onBack}>
          {t("Back")}
        </Button>
        <Button className="w-full" primary disabled={!canContinue} onClick={onContinue}>
          {t("Continue")}
        </Button>
      </div>
    </>
  )
}

const AccountStep: FC<{
  accounts: Account[]
  selected?: string
  onSelect: (address: string) => void
  onBack: () => void
  onContinue: () => void
}> = ({ accounts, selected, onSelect, onBack, onContinue }) => {
  const { t } = useTranslation()

  return (
    <>
      <HeaderBlock
        title={t("Select account")}
        text={t("Choose the account to import into the Taostats Mobile App.")}
      />
      <Spacer />
      {accounts.length === 0 ? (
        <div className="text-fg-secondary text-sm">
          {t("No eligible sr25519 keypair accounts found.")}
        </div>
      ) : (
        <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
          {accounts.map((account) => {
            const isSelected = selected === account.address
            return (
              <button
                key={account.address}
                type="button"
                onClick={() => onSelect(account.address)}
                className={classNames(
                  "flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left",
                  "transition-[color,background-color,border-color] duration-500",
                  isSelected
                    ? "border-fg-brand bg-fg-brand/10"
                    : "border-primary bg-secondary hover:bg-white/[0.04]",
                )}
              >
                <AccountIcon address={account.address} className="size-10 shrink-0 text-xl" />
                <div className="min-w-0 flex-1">
                  <div className="text-fg-primary truncate text-sm font-medium">{account.name}</div>
                  <div className="text-fg-tertiary truncate font-mono text-xs">
                    {account.address}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
      <Spacer />
      <div className="flex gap-2">
        <Button className="w-full" onClick={onBack}>
          {t("Back")}
        </Button>
        <Button className="w-full" primary disabled={!selected} onClick={onContinue}>
          {t("Continue")}
        </Button>
      </div>
    </>
  )
}

const UnlockInner: FC<{
  address: string
  pin: string
  onBack: () => void
  onGenerated: (qrPayload: string) => void
}> = ({ address, pin, onBack, onGenerated }) => {
  const { t } = useTranslation()
  const { password } = usePasswordUnlock()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const generate = useCallback(async () => {
    if (!password) return
    setIsSubmitting(true)
    setError(undefined)
    try {
      const { qrPayload } = await api.accountTaostatsAppImport(address, password, pin)
      onGenerated(qrPayload)
    } catch (err) {
      setError((err as Error)?.message ?? t("Failed to generate QR code"))
    } finally {
      setIsSubmitting(false)
    }
  }, [address, onGenerated, password, pin, t])

  useEffect(() => {
    if (password) void generate()
  }, [generate, password])

  return (
    <div className="flex flex-col gap-4">
      {error ? <div className="text-fg-error text-sm">{error}</div> : null}
      <div className="flex gap-2">
        <Button className="w-full" onClick={onBack} disabled={isSubmitting}>
          {t("Back")}
        </Button>
        <Button className="w-full" primary onClick={() => void generate()} disabled={isSubmitting}>
          {isSubmitting ? t("Generating…") : t("Generate QR code")}
        </Button>
      </div>
    </div>
  )
}

const UnlockAndGenerate: FC<{
  address: string
  pin: string
  onBack: () => void
  onGenerated: (qrPayload: string) => void
}> = ({ address, pin, onBack, onGenerated }) => {
  const { t } = useTranslation()

  return (
    <PasswordUnlock
      title={t("Enter your wallet password to generate the QR code")}
      buttonText={t("Generate QR code")}
    >
      <UnlockInner address={address} pin={pin} onBack={onBack} onGenerated={onGenerated} />
    </PasswordUnlock>
  )
}

const QrStep: FC<{
  qrPayload: string
  createdAt: number
  onDone: () => void
  onRestart: () => void
}> = ({ qrPayload, createdAt, onDone, onRestart }) => {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  const remainingMs = Math.max(0, createdAt + TTL_MS - now)
  const expired = remainingMs <= 0
  const minutes = Math.floor(remainingMs / 60_000)
  const seconds = Math.floor((remainingMs % 60_000) / 1000)
  const countdown = `${minutes}:${seconds.toString().padStart(2, "0")}`

  return (
    <>
      <HeaderBlock
        title={t("Scan with the Taostats app")}
        text={
          expired
            ? t("This QR code has expired. Generate a new one to continue.")
            : t("Scan this QR code with the Taostats Mobile App. Expires in {{time}}.", {
                time: countdown,
              })
        }
      />
      <Spacer />
      <div className="mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-xl bg-white p-4">
        {expired ? (
          <div className="text-fg-error flex h-full items-center justify-center text-center text-sm">
            {t("QR code expired")}
          </div>
        ) : (
          <TextQrCode
            data={qrPayload}
            moduleStyle="square"
            cornersColor={QR_BRAND_COLOR}
            imageOptions={{ imageSize: 0.15, margin: 2 }}
          />
        )}
      </div>
      <Spacer />
      <div className="flex gap-2">
        <Button className="w-full" onClick={onRestart}>
          {t("Start over")}
        </Button>
        <Button className="w-full" primary onClick={onDone} disabled={expired}>
          {t("Done")}
        </Button>
      </div>
    </>
  )
}

const Content = () => {
  const { t } = useTranslation()
  const accounts = useAccounts("owned")
  const [step, setStep] = useState<Step>("explainer")
  const [groups, setGroups] = useState<[string, string, string]>(["", "", ""])
  const [selectedAddress, setSelectedAddress] = useState<string>()
  const [qrPayload, setQrPayload] = useState<string>()
  const [qrCreatedAt, setQrCreatedAt] = useState<number>()

  const eligibleAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => isAccountOfType(account, "keypair") && account.curve === "sr25519",
      ),
    [accounts],
  )

  const pin = useMemo(
    () =>
      groups
        .map((g) => g.replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/gi, "").toUpperCase())
        .join(""),
    [groups],
  )

  const reset = useCallback(() => {
    setStep("explainer")
    setGroups(["", "", ""])
    setSelectedAddress(undefined)
    setQrPayload(undefined)
    setQrCreatedAt(undefined)
  }, [])

  const setGroup = (index: 0 | 1 | 2, value: string) => {
    setGroups((prev) => {
      const next = [...prev] as [string, string, string]
      next[index] = value
      return next
    })
  }

  return (
    <div className="flex w-full flex-col">
      {step === "explainer" ? <ExplainerStep onContinue={() => setStep("pin1")} /> : null}
      {step === "pin1" ? (
        <PinGroupStep
          groupIndex={0}
          value={groups[0]}
          onChange={(value) => setGroup(0, value)}
          onBack={() => setStep("explainer")}
          onContinue={() => setStep("pin2")}
        />
      ) : null}
      {step === "pin2" ? (
        <PinGroupStep
          groupIndex={1}
          value={groups[1]}
          onChange={(value) => setGroup(1, value)}
          onBack={() => setStep("pin1")}
          onContinue={() => setStep("pin3")}
        />
      ) : null}
      {step === "pin3" ? (
        <PinGroupStep
          groupIndex={2}
          value={groups[2]}
          onChange={(value) => setGroup(2, value)}
          onBack={() => setStep("pin2")}
          onContinue={() => setStep("account")}
        />
      ) : null}
      {step === "account" ? (
        <AccountStep
          accounts={eligibleAccounts}
          selected={selectedAddress}
          onSelect={setSelectedAddress}
          onBack={() => setStep("pin3")}
          onContinue={() => setStep("unlock")}
        />
      ) : null}
      {step === "unlock" && selectedAddress ? (
        <UnlockAndGenerate
          address={selectedAddress}
          pin={pin}
          onBack={() => setStep("account")}
          onGenerated={(payload) => {
            setQrPayload(payload)
            setQrCreatedAt(Date.now())
            setStep("qr")
          }}
        />
      ) : null}
      {step === "qr" && qrPayload && qrCreatedAt ? (
        <QrStep qrPayload={qrPayload} createdAt={qrCreatedAt} onDone={reset} onRestart={reset} />
      ) : null}
      {step === "unlock" && !selectedAddress ? (
        <div className="text-fg-error text-sm">{t("Select an account first.")}</div>
      ) : null}
    </div>
  )
}

export const TaostatsAppImportPage = () => <Content />
