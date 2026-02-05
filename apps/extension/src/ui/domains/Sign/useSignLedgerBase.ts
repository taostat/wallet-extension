import { useCallback, useState } from "react"

import { TaostatsLedgerError } from "@ui/hooks/ledger/errors"

export const useSignLedgerBase = () => {
  const [{ isSigning, error }, setState] = useState<{
    isSigning: boolean
    error: TaostatsLedgerError | null
  }>({ isSigning: false, error: null })

  const setError = useCallback((error: TaostatsLedgerError | null) => {
    setState({ isSigning: false, error })
  }, [])

  const setIsSigning = useCallback((isSigning: boolean) => {
    setState({ isSigning, error: null })
  }, [])

  return { setError, setIsSigning, isSigning, error }
}
