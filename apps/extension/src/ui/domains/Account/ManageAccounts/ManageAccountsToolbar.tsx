import { classNames } from "@taostats-wallet/util"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { FolderPlus } from "@untitledui/icons/FolderPlus"
import { Plus } from "@untitledui/icons/Plus"
import { FC, ReactNode, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "taostats-ui"

import { SearchInput } from "@taostats/components/SearchInput"
import { api } from "@ui/api"
import { AnalyticsPage } from "@ui/api/analytics"
import { useNewFolderModal } from "@ui/domains/Account/NewFolderModal"
import { PortfolioToolbarButton } from "@ui/domains/Portfolio/PortfolioToolbarButton"
import { IS_POPUP } from "@ui/util/constants"

import { ExportAllAccountsModal, useExportAllAccountsModal } from "../ExportAllAccountsModal"
import { useManageAccounts } from "./ManageAccountsProvider"

export const ManageAccountsToolbar: FC<{
  analytics: AnalyticsPage
  className?: string
}> = ({ className }) => {
  const { t } = useTranslation()
  const { search, onSearchChange } = useManageAccounts()

  const { open: openNewFolderModal } = useNewFolderModal()

  const navigate = useNavigate()
  const addNewAccountClick = useCallback(() => {
    if (IS_POPUP) {
      api.dashboardOpen("/accounts/add")
      return window.close()
    }

    navigate("/accounts/add")
  }, [navigate])

  return (
    <div
      className={classNames(
        "@container flex w-full shrink-0 items-center justify-between gap-2 overflow-hidden",
        className,
      )}
    >
      <div className="flex grow items-center overflow-hidden">
        <SearchInput
          containerClassName={classNames(
            "!bg-secondary ring-transparent focus-within:border-primary rounded-sm h-[36px] w-full border border-field text-sm !px-2",
            "[&>input]:text-sm [&>svg]:size-4 [&>button>svg]:size-5",
            "@2xl:h-[44px] @2xl:[&>input]:text-base @2xl:[&>svg]:size-5",
          )}
          placeholder={t("Search account or folder")}
          onChange={onSearchChange}
          initialValue={search}
        />
      </div>
      <ToolbarButton icon={FolderPlus} onClick={openNewFolderModal} label={t("Add Folder")} />
      <ToolbarButton icon={Plus} onClick={addNewAccountClick} label={t("Add Account")} />
      <AccountsContextMenu />
    </div>
  )
}

const ToolbarButton: FC<{
  label?: ReactNode
  icon: FC<{ className?: string }>
  onClick: () => void
}> = ({ label, icon: Icon, onClick }) => (
  <Tooltip placement="bottom-end">
    <TooltipTrigger asChild>
      <PortfolioToolbarButton
        className={classNames(
          "size-[36px]",
          !IS_POPUP && "@2xl:h-[44px] @2xl:px-3 flex h-[36px] w-auto items-center gap-1.5 px-2",
        )}
        onClick={onClick}
      >
        <Icon />
        {!IS_POPUP && <div>{label}</div>}
      </PortfolioToolbarButton>
    </TooltipTrigger>
    {IS_POPUP && !label && <TooltipContent>{label}</TooltipContent>}
  </Tooltip>
)

const AccountsContextMenu = () => {
  const { t } = useTranslation()

  const { isOpenExportAll, canExportAll, openExportAll, closeExportAll } =
    useExportAllAccountsModal()

  if (!canExportAll) return null

  return (
    <>
      <ContextMenu placement="bottom-end">
        <Tooltip placement="bottom-end">
          <TooltipTrigger asChild>
            <ContextMenuTrigger asChild>
              <PortfolioToolbarButton
                className={classNames(
                  "size-[36px]",
                  !IS_POPUP && "@2xl:size-[44px]",
                )}
              >
                <DotsHorizontal />
              </PortfolioToolbarButton>
            </ContextMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>{t("More")}</TooltipContent>
        </Tooltip>
        <ContextMenuContent>
          <ContextMenuItem onClick={openExportAll}>{t("Export all as JSON")}</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <ExportAllAccountsModal isOpen={isOpenExportAll} onClose={closeExportAll} />
    </>
  )
}
