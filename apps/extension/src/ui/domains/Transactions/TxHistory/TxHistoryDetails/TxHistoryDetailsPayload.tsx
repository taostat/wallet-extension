import { bind } from "@react-rxjs/core"
import { cn } from "@taostats-wallet/util"
import { WalletTransaction } from "extension-core"
import { log } from "extension-shared"
import { dump as convertToYaml } from "js-yaml"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { BehaviorSubject } from "rxjs"

import { CodeBlock } from "@taostats/components/CodeBlock"
import { CopyToClipboardLinkButton } from "@taostats/components/CopyToClipboardLinkButton"

const subjectDisplayMode = new BehaviorSubject<"yaml" | "json">("yaml")
const [useDisplayMode] = bind(subjectDisplayMode.asObservable())

export const TxHistoryDetailsPayloadDisplayMode = () => {
  const displayMode = useDisplayMode()

  return (
    <div>
      <button
        type="button"
        onClick={() => subjectDisplayMode.next("yaml")}
        className={cn(
          "cursor-pointer",
          displayMode === "yaml" ? "text-body" : "hover:text-grey-300 underline",
        )}
      >
        YAML
      </button>{" "}
      /{" "}
      <button
        type="button"
        onClick={() => subjectDisplayMode.next("json")}
        className={cn(
          "cursor-pointer",
          displayMode === "json" ? "text-body" : "hover:text-grey-300 underline",
        )}
      >
        JSON
      </button>
    </div>
  )
}

export const TxHistoryDetailsPayload: FC<{
  tx: WalletTransaction
}> = ({ tx }) => {
  const { t } = useTranslation()
  const displayMode = useDisplayMode()

  const payload = useMemo(() => {
    return tx.payload
  }, [tx])

  const code = useMemo(() => {
    try {
      switch (displayMode) {
        case "json":
          return JSON.stringify(payload, null, 2)
        case "yaml":
          return convertToYaml(payload)
        default:
          return typeof payload === "string" ? payload : ""
      }
    } catch (err) {
      log.error("Failed to convert payload", { err, payload })
      return t("Failed to parse payload")
    }
  }, [displayMode, payload, t])

  if (!code) return null

  return (
    <div>
      <CodeBlock code={code} />
      <div className="mt-2 text-right">
        <CopyToClipboardLinkButton data={code} />
      </div>
    </div>
  )
}
