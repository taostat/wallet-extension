import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react"
import { Network, NetworkId } from "@taostats-wallet/chaindata-provider"
import { classNames } from "@taostats-wallet/util"
import { ChevronDown } from "@untitledui/icons/ChevronDown"
import { X } from "@untitledui/icons/X"
import { FC, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useNetworkDisplayNamesMapById } from "@ui/state/networks"

import { NetworkLogo } from "./NetworkLogo"
import { NetworkName } from "./NetworkName"

export type NetworkComboBoxOption = Pick<Network, "id" | "name" | "logo">

export const NetworkCombo: FC<{
  networks: NetworkComboBoxOption[]
  value: NetworkId | null
  placeholder?: string
  className?: string
  bgClassName?: string
  onChange: (networkId: NetworkId | null) => void
}> = ({ networks, value, placeholder, onChange, className, bgClassName = "bg-secondary" }) => {
  const { t } = useTranslation()
  const networkNameById = useNetworkDisplayNamesMapById()

  const [search, setSearch] = useState("")

  const searchResults = useMemo(() => {
    if (!search) return networks
    const lowerSearch = search.toLowerCase()
    return networks.filter((item) => item.name.toLowerCase().includes(lowerSearch))
  }, [networks, search])

  const selected = useMemo(() => {
    return networks.find((network) => network.id === value) ?? null
  }, [networks, value])

  return (
    <Combobox
      immediate
      onChange={(n) => onChange(n?.id ?? null)}
      value={selected}
      virtual={{ options: searchResults }}
      onClose={() => setSearch("")}
    >
      {({ open }) => (
        <div className={classNames("relative")}>
          <div
            className={classNames(
              "flex h-24 items-center gap-4 px-8",
              "w-full",
              "focus-within:border-primary rounded-sm border border-transparent",
              open && "rounded-b-none border-b-transparent",
              className,
              bgClassName,
            )}
          >
            <NetworkLogo
              networkId={value ?? undefined}
              className={classNames("size-12", !selected && "opacity-50")}
            />
            <ComboboxInput
              placeholder={placeholder ?? t("Select network")}
              displayValue={(n: Network) => networkNameById[n?.id ?? ""] ?? ""}
              className={classNames(
                "placeholder:text-fg-disabled text-fg-tertiary focus:text-fg-primary h-full grow bg-transparent",
              )}
              onChange={(e) => setSearch(e.target.value)}
            />
            {!open && (!!search || selected) ? (
              <button type="button" className="group" onClick={() => onChange(null)}>
                <X className="group-hover:text-fg-primary text-fg-secondary size-12" />
              </button>
            ) : (
              <ComboboxButton className="group">
                <ChevronDown className="group-hover:text-fg-primary text-fg-secondary size-12" />
              </ComboboxButton>
            )}
          </div>
          <ComboboxOptions
            className={classNames(
              "overflow-x-none absolute top-24 z-10 max-h-[28rem] min-h-10 w-full overflow-y-scroll rounded-b pb-0 empty:invisible",
              "border-primary border",
              bgClassName,
            )}
          >
            {({ option }) => (
              <ComboboxOption
                key={option.id}
                value={option}
                className={classNames(
                  `text-fg-secondary [&[data-selected]]:text-fg-primary [&[data-selected]]:bg-tertiary [&[data-focus]]:bg-tertiary hover:bg-tertiary relative flex h-24 w-full items-center gap-4 px-8`,
                )}
              >
                <NetworkLogo networkId={option.id} className="size-12" />
                <NetworkName networkId={option.id} className="text-base" />
              </ComboboxOption>
            )}
          </ComboboxOptions>
        </div>
      )}
    </Combobox>
  )
}
