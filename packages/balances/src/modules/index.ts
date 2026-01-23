import { SubAssetsBalanceModule } from "./substrate-assets"
import { SubDTaoBalanceModule } from "./substrate-dtao"
import { SubForeignAssetsBalanceModule } from "./substrate-foreignassets"
import { SubHydrationBalanceModule } from "./substrate-hydration"
import { SubNativeBalanceModule } from "./substrate-native"
import { SubPsp22BalanceModule } from "./substrate-psp22"
import { SubTokensBalanceModule } from "./substrate-tokens"

export const BALANCE_MODULES = [
  SubNativeBalanceModule,
  SubAssetsBalanceModule,
  SubDTaoBalanceModule,
  SubHydrationBalanceModule,
  SubForeignAssetsBalanceModule,
  SubPsp22BalanceModule,
  SubTokensBalanceModule,
]

export type AnyBalanceModule = (typeof BALANCE_MODULES)[number] // TODO yeet ? should use IBalance

export * from "./substrate-native"
export * from "./substrate-assets"
export * from "./substrate-foreignassets"
export * from "./substrate-hydration"
export * from "./substrate-psp22"
export * from "./substrate-tokens"
export * from "./substrate-dtao"

export * from "./abis"

export * from "../types/IBalanceModule"
