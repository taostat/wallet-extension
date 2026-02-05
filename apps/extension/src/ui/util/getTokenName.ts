export const getTokenName = (tokenName: string | undefined) => {
  return tokenName === "SN0 | Root"
    ? "Root Stake"
    : tokenName === "Bittensor"
      ? "Unstaked Tao"
      : tokenName
}
