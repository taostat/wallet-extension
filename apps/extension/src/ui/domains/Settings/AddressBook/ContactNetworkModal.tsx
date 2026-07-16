import { Network, NetworkId } from "@taostats-wallet/chaindata-provider"
import { classNames } from "@taostats-wallet/util"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useOpenClose } from "taostats-ui"

import { NetworkLogo } from "@ui/domains/Networks/NetworkLogo"
import { NetworkOptionsModal } from "@ui/domains/Portfolio/NetworkOptionsModal"
import { NetworkOption } from "@ui/state"

export const ContactNetworkPickerButton: FC<{
  networks: Network[]
  selected: NetworkId | null
  onChange: (networkId: string | null) => void
  containerId?: string
  className?: string
}> = ({ networks, selected, onChange, className, containerId }) => {
  const { t } = useTranslation()
  const { isOpen, open, close } = useOpenClose()

  const options = useMemo(() => {
    const networkOptions = networks
      .map(
        (network): NetworkOption => ({
          id: network.id,
          name: network.name,
          networkIds: [network.id],
        }),
      )
      .sort((a, b) => a.name.localeCompare(b.name))

    return [
      ...networkOptions.filter(({ id }) => selected === id),
      ...networkOptions.filter(({ id }) => selected !== id),
    ]
  }, [networks, selected])

  const option = useMemo(() => options.find(({ id }) => id === selected), [options, selected])

  const handleOptionChange = (newOption: NetworkOption | null) => {
    onChange(newOption?.id ?? null)
    close()
  }

  return (
    <>
      <button
        type="button"
        className={classNames(
          "flex h-[56px] w-full items-center gap-3 overflow-hidden rounded-sm px-4",
          "bg-secondary enabled:hover:bg-secondary text-fg-secondary enabled:hover:text-fg-primary",
          className,
        )}
        onClick={open}
      >
        <div>
          <NetworkLogo networkId={option?.id} className="text-[24px]" />
        </div>
        <div className="text-fg-primary grow truncate text-left">
          {option?.name ?? t("All Networks")}
        </div>
        <ChevronRight className="size-6" />
      </button>
      <NetworkOptionsModal
        isOpen={isOpen}
        selected={option ?? null}
        options={options}
        onChange={handleOptionChange}
        onClose={close}
        containerId={containerId}
      />
    </>
  )
}
