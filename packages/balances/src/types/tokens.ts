import { TokenBaseSchema } from "@taostats-wallet/chaindata-provider"

export const TokenConfigBaseSchema = TokenBaseSchema.partial().omit({ id: true })
