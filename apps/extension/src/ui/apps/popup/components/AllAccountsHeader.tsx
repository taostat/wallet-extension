import { PopoutIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { Account } from "extension-core"
import { FC, useCallback, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useHoverDirty } from "react-use"
import { IconButton } from "taostats-ui"

import { api } from "@ui/api"
import { TotalFiatBalance } from "@ui/apps/popup/components/TotalFiatBalance"
import { IS_EMBEDDED_POPUP } from "@ui/util/constants"

export const AllAccountsHeader: FC<{ accounts: Account[] }> = ({ accounts }) => {
  const navigate = useNavigate()
  const handleClick = useCallback(() => navigate("/portfolio/tokens"), [navigate])
  const ref = useRef<HTMLDivElement>(null)
  const isHovered = useHoverDirty(ref)
  const disabled = useMemo(() => !accounts.length, [accounts.length])

  return (
    <div ref={ref} className="relative min-h-[112px] w-full">
      <button
        type="button"
        className={classNames(
          "flex size-full items-center justify-end gap-2 overflow-hidden rounded-sm p-3 text-lg",
          "bg-secondary text-fg-secondary transition-colors duration-75",
          !disabled && "hover:text-fg-primary",
        )}
        onClick={!disabled ? handleClick : undefined}
        disabled={disabled}
      >
        {!disabled && <ChevronRight className="z-10" />}
      </button>
      <TotalFiatBalance
        className="pointer-events-none absolute left-0 top-0 size-full p-3"
        mouseOver={isHovered}
        disabled={disabled}
      />
      {IS_EMBEDDED_POPUP && <PopoutButton />}
    </div>
  )
}

const PopoutButton: FC = () => {
  const handleClick = useCallback(() => {
    api.popupOpen("#/portfolio")
    window.close()
  }, [])

  return (
    <IconButton className="absolute right-1.5 top-1.5 p-1.5 text-base" onClick={handleClick}>
      <PopoutIcon />
    </IconButton>
  )
}
