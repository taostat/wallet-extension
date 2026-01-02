import { TokenBaseSchema } from "@taostats/chaindata-provider"

export const TokenConfigBaseSchema = TokenBaseSchema.partial().omit({ id: true })
