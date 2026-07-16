import { Placement } from "@floating-ui/react"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { AccountsCatalogTree, TreeFolder, TreeItem } from "extension-core"
import { FC, ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "taostats-ui"

import { useAccountsCatalog } from "@ui/state"

import { useDeleteFolderModal } from "./DeleteFolderModal"
import { useRenameFolderModal } from "./RenameFolderModal"

export const FolderContextMenu: FC<{
  folderId: string
  trigger?: ReactNode
  noManageAccountsLink?: boolean
  placement?: Placement
}> = ({ folderId, trigger, noManageAccountsLink, placement }) => {
  const { t } = useTranslation()

  const { portfolio, watched } = useAccountsCatalog()

  const [folder, treeName] = useMemo<[TreeFolder | null, AccountsCatalogTree | null]>(() => {
    const portfolioFolder = portfolio.find(folderById(folderId))
    if (portfolioFolder) return [portfolioFolder, "portfolio"]

    const watchedFolder = watched.find(folderById(folderId))
    if (watchedFolder) return [watchedFolder, "watched"]

    return [null, null]
  }, [folderId, portfolio, watched])

  const { open: renameFolder } = useRenameFolderModal()
  const { open: deleteFolder } = useDeleteFolderModal()
  const navigate = useNavigate()

  if (!folder || !treeName) return null

  return (
    <ContextMenu placement={placement}>
      {trigger ?? (
        <ContextMenuTrigger className="enabled:hover:bg-tertiary text-fg-secondary enabled:hover:text-fg-primary disabled:text-fg-disabled rounded p-3 disabled:cursor-[inherit]">
          <DotsHorizontal className="shrink-0" />
        </ContextMenuTrigger>
      )}
      <ContextMenuContent
        data-no-dnd="true"
        className="border-primary z-50 flex w-min flex-col whitespace-nowrap rounded-sm border bg-black px-1 py-1.5 text-left text-sm shadow-lg"
      >
        <ContextMenuItem onClick={() => renameFolder(folder.id, folder.name, treeName)}>
          {t("Rename")}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => deleteFolder(folder.id, folder.name, treeName)}>
          {t("Delete folder")}
        </ContextMenuItem>
        {!noManageAccountsLink && (
          <ContextMenuItem onClick={() => navigate("/settings/accounts")}>
            {t("Manage accounts")}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

const folderById =
  (id: string) =>
  (folder: TreeItem): folder is TreeFolder =>
    folder.type === "folder" && folder.id === id
