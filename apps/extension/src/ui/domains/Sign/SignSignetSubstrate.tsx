import { SignerPayloadJSON } from "@substrate/txwrapper-core"
import { XCircle } from "@untitledui/icons/XCircle"
import { AccountSignet, SignerPayloadRaw } from "extension-core"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

type Props = {
  account: AccountSignet
  onCancel: () => void
  onApprove: () => Promise<void>
  payload: SignerPayloadJSON | SignerPayloadRaw
}

const SignetSignetError: React.FC<{ call: boolean; network: boolean }> = ({ call, network }) => {
  if (!call && !network) return null
  return (
    <div className="bg-secondary flex w-full items-center justify-center gap-2 rounded-sm p-3">
      <XCircle className="text-fg-error min-w-[1em] shrink-0 text-[20px]" />
      <p className="text-fg-tertiary text-left">
        {call
          ? "This request is not supported on Signet."
          : network
            ? "Network not supported for the selected Signet account."
            : null}
      </p>
    </div>
  )
}

export const SignSignetSubstrate: React.FC<Props> = ({ account, onApprove, onCancel, payload }) => {
  const { t } = useTranslation()

  const error = useMemo(() => {
    const jsonPayload = payload as SignerPayloadJSON
    return {
      // signet requires the method so that it can wrap it in a multi + proxy call
      call: !jsonPayload.genesisHash || !jsonPayload.method,
      // signet accounts only support the chain that the signet account is on.
      network: !jsonPayload.genesisHash || jsonPayload.genesisHash !== account.genesisHash,
    }
  }, [account.genesisHash, payload])

  return (
    <div className={"flex w-full flex-col gap-3"}>
      <SignetSignetError {...error} />
      <div className={"grid w-full grid-cols-2 gap-4"}>
        {!!onCancel && <Button onClick={onCancel}>{t("Cancel")}</Button>}
        <Button
          primary
          onClick={onApprove}
          disabled={!!error.call || !!error.network}
          className="px-2"
        >
          {t("Sign on Signet")}
        </Button>
      </div>
    </div>
  )
}
