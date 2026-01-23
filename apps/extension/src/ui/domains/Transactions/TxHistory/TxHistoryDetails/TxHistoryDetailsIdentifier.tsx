import { CodeBlock } from "@taostats/components/CodeBlock"
import { CopyToClipboardLinkButton } from "@taostats/components/CopyToClipboardLinkButton"
import { WalletTransaction } from "extension-core"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"

export const TxHistoryDetailsIdentifier: FC<{
  tx: WalletTransaction
}> = ({ tx }) => {
  const { t } = useTranslation()

  const identifier = useMemo(() => {
    switch (tx.platform) {
      case "polkadot":
        return tx.hash
    }
  }, [tx])

  if (!identifier) return t("Unknown")

  return (
    <div>
      <CodeBlock code={identifier} />
      <div className="mt-2 text-right">
        <CopyToClipboardLinkButton data={identifier} />
      </div>
    </div>
  )
}
