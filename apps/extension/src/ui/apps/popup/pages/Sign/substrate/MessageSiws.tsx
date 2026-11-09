import { SiwsMessage } from "@talismn/siws"
import { DotNetwork } from "@taostats-wallet/chaindata-provider"
import { UserRightIcon } from "@taostats-wallet/icons"
import { Account } from "extension-core"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button, Drawer, useOpenClose } from "taostats-ui"

import { AccountPill } from "@ui/domains/Account/AccountPill"
import { SignAlertMessage } from "@ui/domains/Sign/SignAlertMessage"
import { ViewDetailsAddress } from "@ui/domains/Sign/ViewDetails/ViewDetailsAddress"
import { ViewDetailsButton } from "@ui/domains/Sign/ViewDetails/ViewDetailsButton"
import { ViewDetailsField } from "@ui/domains/Sign/ViewDetails/ViewDetailsField"

export type Props = {
  account: Account
  chain: DotNetwork | null | undefined
  request: SiwsMessage
  validationError: string | null
}

export const MessageSiws = ({ account, chain, request, validationError }: Props) => {
  const { t } = useTranslation()
  const { isOpen, open, close } = useOpenClose()

  return (
    <div className="scrollable scrollable-800 flex h-full max-h-full w-full flex-col items-center overflow-auto">
      <div className="my-6 flex w-full flex-col items-center">
        <div className="bg-secondary rounded-full p-2.5">
          <UserRightIcon className="text-fg-brand text-[28px]" />
        </div>
        <div className="mt-4 text-lg font-bold">{t("Sign In")}</div>
        <div className="text-fg-secondary my-8 flex w-full flex-col items-center gap-1.5 overflow-hidden">
          <div className="text-fg-primary max-w-full truncate font-bold">{request.domain}</div>
          <div className="text-fg-secondary">{t("wants you to sign in with Substrate")}</div>
          <div className="[&>button>div>span]:text-fg-primary flex max-w-full items-center justify-center gap-1 truncate [&>button>div>span]:font-bold">
            <span>{t("with")}</span>
            <AccountPill account={account} ss58Format={chain?.prefix ?? undefined} />
          </div>
        </div>
        {!!request.statement && (
          <div className="bg-secondary mb-8 w-full rounded-sm p-2 text-sm">
            <div className="text-fg-disabled text-xs">{t("Statement")}</div>
            <div className="text-fg-primary leading-paragraph mt-1">{request.statement}</div>
          </div>
        )}
        <ViewDetailsButton onClick={open} />
      </div>
      <div className="grow"></div>
      {validationError && (
        <SignAlertMessage type="error" className="mt-4">
          {t("Sign in domain or address is different from website domain or signer address.")}
        </SignAlertMessage>
      )}
      <Drawer anchor="bottom" containerId="main" isOpen={isOpen} onDismiss={close}>
        <ViewDetailsContent account={account} request={request} onClose={close} />
      </Drawer>
    </div>
  )
}

const ViewDetailsContent: FC<{
  account: Account
  request: SiwsMessage
  onClose: () => void
}> = ({ account, request, onClose }) => {
  const { t } = useTranslation()
  const message = useMemo(() => request.prepareMessage(), [request])

  return (
    <div className="bg-secondary flex max-h-[600px] w-full flex-col gap-6 p-6">
      <div className="scrollable scrollable-700 flex-grow overflow-y-auto overflow-x-hidden pr-2 text-sm leading-[20px]">
        <div className="text-fg-secondary">{t("Details")}</div>
        <p>
          {t(
            "You are about to sign in via Substrate. Please ensure you trust the application before continuing.",
          )}
        </p>
        <ViewDetailsAddress label={t("From")} address={account.address} network={null} />
        <ViewDetailsField label={t("Domain")}>{request.domain}</ViewDetailsField>
        <ViewDetailsField label={t("Statement")}>{request.statement}</ViewDetailsField>
        {request.chainId && (
          <ViewDetailsField label={t("ChainId")}>{request.chainId}</ViewDetailsField>
        )}
        {request.chainName && (
          <ViewDetailsField label={t("Chain Name")}>{request.chainName}</ViewDetailsField>
        )}
        <ViewDetailsField label={t("Nonce")}>{request.nonce}</ViewDetailsField>
        <ViewDetailsField label={t("Issued At")}>{request.issuedAt}</ViewDetailsField>
        <ViewDetailsField label={t("Expires At")}>{request.expirationTime}</ViewDetailsField>
        <ViewDetailsField label={t("Message")}>
          <div className="mt-1 pr-1">
            <pre className="text-fg-secondary scrollable scrollable-700 bg-secondary rounded-xs w-full overflow-x-auto p-2">
              {message}
            </pre>
          </div>
        </ViewDetailsField>
      </div>
      <Button className="shrink-0" onClick={onClose}>
        {t("Close")}
      </Button>
    </div>
  )
}
