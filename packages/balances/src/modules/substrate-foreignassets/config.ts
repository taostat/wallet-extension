import { SubForeignAssetsTokenSchema } from "@taostats-wallet/chaindata-provider"

export { type SubForeignAssetsTokenConfig as TokenConfig } from "./types"

export const MODULE_TYPE = SubForeignAssetsTokenSchema.shape.type.value
export const PLATFORM = SubForeignAssetsTokenSchema.shape.platform.value
