import { yupResolver } from "@hookform/resolvers/yup"
import { Key01 } from "@untitledui/icons/Key01"
import { FC, ReactNode, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button, FormFieldInputText } from "taostats-ui"
import * as yup from "yup"

import { CapsLockWarningIcon } from "@taostats/components/CapsLockWarningIcon"
import { provideContext } from "@taostats/util/provideContext"
import { api } from "@ui/api"
import { useSensitiveState } from "@ui/hooks/useSensitiveState"

type FormData = {
  password: string
}

const schema = yup
  .object({
    password: yup.string().required(" "),
  })
  .required()

type MnemonicUnlockContext = {
  unlock: (password: string) => Promise<void>
  mnemonic?: string
  mnemonicId: string
}

function useMnemonicUnlockContext({ mnemonicId }: { mnemonicId: string }): MnemonicUnlockContext {
  const [mnemonic, setMnemonic] = useSensitiveState<string>()

  const unlock = useCallback(
    async (password: string) => {
      const secret = await api.mnemonicUnlock(mnemonicId, password)
      setMnemonic(secret)
    },
    [mnemonicId, setMnemonic],
  )

  return {
    unlock,
    mnemonic,
    mnemonicId,
  }
}

const [MnemonicUnlockProvider, useMnemonicUnlock] = provideContext(useMnemonicUnlockContext)

export { useMnemonicUnlock }

type MnemonicUnlockProps = {
  className?: string
  children: ReactNode
  buttonText?: string
  title?: ReactNode
  onUnlocked?: () => void
}

const BaseMnemonicUnlock: FC<MnemonicUnlockProps> = ({
  children,
  buttonText,
  title,
  onUnlocked,
}) => {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: yupResolver(schema),
  })

  const { unlock, mnemonic } = useMnemonicUnlock()

  const submit = useCallback(
    async ({ password }: FormData) => {
      try {
        await unlock(password)
      } catch (err) {
        setError("password", {
          message: (err as Error)?.message ?? "",
        })
      }
    },
    [unlock, setError],
  )

  useEffect(() => {
    if (!mnemonic) setFocus("password")
  }, [mnemonic, setFocus])

  useEffect(() => {
    if (mnemonic) onUnlocked?.()
  }, [mnemonic, onUnlocked])

  useEffect(() => {
    return () => {
      setValue("password", "")
    }
  }, [setValue])

  if (mnemonic) return <div className="w-full">{children}</div>

  return (
    <form onSubmit={handleSubmit(submit)} className="flex w-full flex-col gap-xl">
      {title && <div className="text-fg-secondary text-sm font-medium">{title}</div>}
      <div>
        <FormFieldInputText
          before={<Key01 className="h-5 w-5 opacity-50" />}
          {...register("password")}
          type="password"
          placeholder={t("Enter Password")}
          spellCheck={false}
          data-lpignore
          after={<CapsLockWarningIcon />}
        />
        {errors.password?.message ? (
          <div className="text-fg-orange mt-xs max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-right text-xs leading-none">
            {errors.password.message}
          </div>
        ) : null}
      </div>
      <Button
        type="submit"
        fullWidth
        disabled={!isValid}
        processing={isSubmitting}
        className="!border-0 !bg-fg-brand shadow-none hover:!bg-fg-brand/90 !text-black focus-visible:ring-0"
      >
        {buttonText || t("Unlock")}
      </Button>
    </form>
  )
}

export const MnemonicUnlock: FC<MnemonicUnlockProps & { mnemonicId: string }> = ({
  children,
  mnemonicId,
  ...props
}) => {
  return (
    <MnemonicUnlockProvider mnemonicId={mnemonicId}>
      <BaseMnemonicUnlock {...props}>{children}</BaseMnemonicUnlock>
    </MnemonicUnlockProvider>
  )
}
