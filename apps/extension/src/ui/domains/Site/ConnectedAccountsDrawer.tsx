import { X } from "@untitledui/icons/X"
import { FC } from "react"
import { Drawer, IconButton } from "taostats-ui"

import { AppPill } from "@taostats/components/AppPill"
import { ScrollContainer } from "@taostats/components/ScrollContainer"
import { useCurrentSite } from "@ui/hooks/useCurrentSite"

import { ConnectedAccounts } from "./ConnectedAccounts"

type Props = {
  open: boolean
  onClose: () => void
}

const ConnectedAccountsDrawer: FC<Props> = ({ open, onClose }) => {
  const { id, url } = useCurrentSite()

  if (!id) return null
  return (
    <Drawer className="w-full" containerId="main" anchor="right" isOpen={open} onDismiss={onClose}>
      <div className="flex h-full flex-col bg-black">
        <header className="px-6 py-5 text-center">
          <AppPill url={url} />
          <IconButton className="absolute right-5 top-5" onClick={onClose}>
            <X />
          </IconButton>
        </header>
        <ScrollContainer innerClassName="px-6">
          <ConnectedAccounts />
        </ScrollContainer>
      </div>
    </Drawer>
  )
}

export default ConnectedAccountsDrawer
