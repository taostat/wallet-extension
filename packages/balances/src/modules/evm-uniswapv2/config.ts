import { EvmUniswapV2TokenSchema } from "@taostats/chaindata-provider"

export { type EvmUniswapV2TokenConfig as TokenConfig } from "./types"

export const MODULE_TYPE = EvmUniswapV2TokenSchema.shape.type.value
export const PLATFORM = EvmUniswapV2TokenSchema.shape.platform.value
