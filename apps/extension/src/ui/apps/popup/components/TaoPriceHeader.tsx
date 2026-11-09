import { FC } from "react"
import { Pill } from "taostats-ui"

import { BittensorIcon } from "@taostats/theme/logos"
import { useTaoPrice } from "@ui/hooks/useTaoPrice"

export const TaoPriceHeader: FC = () => {
  const { data } = useTaoPrice()

  if (!data) return null

  const price = Number(data.price)

  if (!Number.isFinite(price)) return null

  return (
    <div className="flex items-center gap-1.5">
      <Pill variant="secondary" size="sm" mono>
        <BittensorIcon className="size-3" />${price.toFixed(2)}
      </Pill>
    </div>
  )
}
