import { SolNativeTokenSchema } from "@taostats-wallet/chaindata-provider"

export { type SolNativeTokenConfig as TokenConfig } from "./types"

export const MODULE_TYPE = SolNativeTokenSchema.shape.type.value
export const PLATFORM = SolNativeTokenSchema.shape.platform.value
