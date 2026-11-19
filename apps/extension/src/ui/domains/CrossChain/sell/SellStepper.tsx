import { ExecutionStep, FILL_WINDOW_SECONDS } from "@taostats-wallet/cross-chain"
import { cn } from "@taostats-wallet/util"
import { AlertTriangle } from "@untitledui/icons/AlertTriangle"
import { Check } from "@untitledui/icons/Check"
import { Loading01 } from "@untitledui/icons/Loading01"
import { X } from "@untitledui/icons/X"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { ExtrinsicLink } from "./components"

const FILL_WINDOW_MINUTES = Math.round(FILL_WINDOW_SECONDS / 60)

/**
 * The sell's progress, one row per step: a ring while pending, a spinner while active (with a
 * short hint), a check when done, a cross when it failed, a warning when its outcome is unknown.
 * The list is a live region: each step reached is read out.
 */
export const SellStepper: FC<{ steps: readonly ExecutionStep[] }> = ({ steps }) => (
  <ol aria-live="polite" className="bg-secondary flex flex-col gap-4 rounded p-4">
    {steps.map((step, index) => (
      <StepRow key={step.id} step={step} isLast={index === steps.length - 1} />
    ))}
  </ol>
)

const StepRow: FC<{ step: ExecutionStep; isLast: boolean }> = ({ step, isLast }) => {
  const label = useStepLabel(step)
  const hint = useStepHint(step)
  const { t } = useTranslation()

  return (
    <li className="relative flex items-start gap-3">
      {isLast ? null : (
        <span
          aria-hidden
          className={cn(
            "absolute left-[11px] top-7 h-[calc(100%-12px)] w-0.5 rounded-full",
            step.status === "done" ? "bg-fg-brand" : "bg-tertiary",
          )}
        />
      )}
      <StepIcon status={step.status} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span
            className={cn(
              step.status === "pending" ? "text-fg-tertiary" : "text-fg-primary",
              step.status === "failed" && "text-fg-error",
              step.status === "unknown" && "text-fg-orange",
            )}
          >
            {label}
          </span>
          {step.id === "submitted" && step.hash ? (
            <ExtrinsicLink hash={step.hash} className="shrink-0 text-xs" />
          ) : null}
        </div>
        {hint ? <span className="text-fg-secondary text-xs">{hint}</span> : null}
        {step.status === "unknown" ? (
          <span className="text-fg-secondary text-xs">{t("Not confirmed yet")}</span>
        ) : null}
      </div>
    </li>
  )
}

const StepIcon: FC<{ status: ExecutionStep["status"] }> = ({ status }) => {
  switch (status) {
    case "active":
      return (
        <span className="flex size-6 shrink-0 items-center justify-center">
          <Loading01 className="animate-spin-slow text-fg-brand size-5" />
        </span>
      )
    case "done":
      return (
        <span className="bg-fg-brand flex size-6 shrink-0 items-center justify-center rounded-full">
          <Check className="text-fg-primary-alt size-4" aria-hidden />
        </span>
      )
    case "failed":
      return (
        <span className="bg-error-secondary flex size-6 shrink-0 items-center justify-center rounded-full">
          <X className="text-fg-error size-4" aria-hidden />
        </span>
      )
    case "unknown":
      return (
        <span className="bg-orange-secondary/10 flex size-6 shrink-0 items-center justify-center rounded-full">
          <AlertTriangle className="text-fg-orange size-4" aria-hidden />
        </span>
      )
    case "pending":
      return (
        <span className="flex size-6 shrink-0 items-center justify-center">
          <span className="border-primary bg-tertiary size-4 rounded-full border-2" />
        </span>
      )
  }
}

const useStepLabel = (step: ExecutionStep): string => {
  const { t } = useTranslation()
  switch (step.id) {
    case "sign":
      return t("Sign the swap")
    case "submitted":
      return t("Swap submitted")
    case "inBlock":
      return t("Included in a block")
    case "orderOpen":
      return t("Swap opened")
    case "delivering":
      return t("Delivering to {{network}}", { network: "Ethereum" })
    case "delivered":
      return t("Delivered")
    case "refund":
      return t("Refund as USDC on {{network}}", { network: "Bittensor" })
  }
}

/** The short line under a step: what is happening now. */
const useStepHint = (step: ExecutionStep): string | undefined => {
  const { t } = useTranslation()
  if (step.status === "failed" && step.id === "delivering")
    return t("Not filled within {{minutes}} minutes", { minutes: FILL_WINDOW_MINUTES })
  if (step.status !== "active") return undefined
  switch (step.note) {
    case "preparing":
      return t("Getting the final price")
    case "signing":
      // The wallet signs at once, with no prompt: nothing to say.
      return undefined
    case "confirming":
      return t("Waiting for {{network}} to confirm", { network: "Bittensor" })
    case "updatingPrice":
      return t("Updating the price")
    case undefined:
      break
  }
  if (step.id === "delivering") return t("Usually takes a few minutes")
  if (step.id === "refund") return t("Refunds happen on their own: nothing to do")
  return undefined
}
