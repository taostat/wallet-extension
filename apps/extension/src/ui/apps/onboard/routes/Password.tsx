import { yupResolver } from "@hookform/resolvers/yup"
import { classNames } from "@taostats-wallet/util"
import { ArrowRight } from "@untitledui/icons/ArrowRight"
import { useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button, FormFieldContainer, FormFieldInputText } from "taostats-ui"
import * as yup from "yup"

import { BackButton } from "@taostats/components/BackButton"
import { CapsLockWarningMessage } from "@taostats/components/CapsLockWarningMessage"
import { PasswordStrength } from "@taostats/components/PasswordStrength"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"

import { OnboardDialog } from "../components/OnboardDialog"
import { useOnboard } from "../context"
import { OnboardLayout } from "../OnboardLayout"

type FormData = {
  password: string
  passwordConfirm: string
}

const INPUT_CONTAINER_PROPS_PASSWORD = { className: "opacity-70" }

const schema = yup
  .object({
    password: yup.string().required(" ").min(6, "Password must be at least 6 characters long"), // matches the medium strengh requirement
    passwordConfirm: yup.string().required(" "),
  })
  .test((value, ctx) => {
    const { password, passwordConfirm } = value
    if (password && passwordConfirm && password !== passwordConfirm) {
      return ctx.createError({
        path: "passwordConfirm",
        message: "Passwords must match",
      })
    }
    return true
  })

  .required()

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Onboarding",
  featureVersion: 5,
  page: "Onboarding - Step 2 - Password",
}

export const PasswordPage = () => {
  const { t } = useTranslation()
  useAnalyticsPageView(ANALYTICS_PAGE)

  const { data, createPassword, passwordExists, setOnboarded } = useOnboard()

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: data,
    resolver: yupResolver(schema),
  })
  const password = watch("password")

  // revalidate to get rid of "must match" error message after editing first field
  useEffect(() => {
    trigger()
  }, [trigger, password])

  useEffect(() => {
    return () => {
      setValue("password", "")
      setValue("passwordConfirm", "")
    }
  }, [setValue])

  const navigateNext = useCallback(() => {
    setOnboarded()
  }, [setOnboarded])

  const submit = useCallback(
    async (fields: FormData) => {
      const { password, passwordConfirm } = fields
      if (!password || !passwordConfirm) return

      try {
        await createPassword(password, passwordConfirm)
      } catch (e) {
        setError("password", { message: (e as Error).message })
        return
      }
      sendAnalyticsEvent({
        ...ANALYTICS_PAGE,
        name: "Submit",
        action: "Choose password continue button",
      })
      navigateNext()
    },
    [setError, createPassword, navigateNext],
  )

  return (
    <OnboardLayout analytics={ANALYTICS_PAGE} className="min-w-[60rem] items-start pt-32">
      <div className="flex w-[40rem] flex-col gap-4">
        <BackButton
          analytics={ANALYTICS_PAGE}
          className="text-fg-secondary hover:text-fg-primary self-start bg-transparent pl-0 hover:bg-transparent"
        />
        {passwordExists && (
        <OnboardDialog title={t("You've already set your password")}>
          <div className="text-fg-secondary flex flex-col gap-8">
            <p>
              {t(
                "You can change your password in the settings at any time after you've onboarded.",
              )}
            </p>
            <p>
              {t(
                "If you can't remember the password you set, you should re-install Taostats Wallet now, and restart this onboarding process.",
              )}
            </p>
            <Button fullWidth primary className="mt-16" type="button" onClick={navigateNext}>
              {t("Continue")}
            </Button>
          </div>
        </OnboardDialog>
      )}
      {!passwordExists && (
        <OnboardDialog title={t("Set a password")}>
          <p>
            {t(
              "This is used to unlock your wallet and is stored securely on your device. We recommend 12 characters, with uppercase and lowercase letters, symbols and numbers.",
            )}
          </p>
          <form onSubmit={handleSubmit(submit)} autoComplete="off">
            <div className="flex flex-col pb-2">
              <div className="mb-2 mt-4 flex h-[1.2em] items-center justify-between text-sm">
                <div
                  className={classNames(password ? "text-fg-secondary" : "text-fg-secondary/50")}
                >
                  {t("Password strength")}: <PasswordStrength password={password} />
                </div>
                <div>
                  <CapsLockWarningMessage />
                </div>
              </div>
              <FormFieldContainer error={errors.password?.message}>
                <FormFieldInputText
                  {...register("password")}
                  type="password"
                  placeholder={t("Enter password")}
                  autoComplete="new-password"
                  spellCheck={false}
                  data-lpignore
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  containerProps={INPUT_CONTAINER_PROPS_PASSWORD}
                />
              </FormFieldContainer>
              <FormFieldContainer error={errors.passwordConfirm?.message}>
                <FormFieldInputText
                  {...register("passwordConfirm")}
                  type="password"
                  autoComplete="off"
                  placeholder={t("Confirm password")}
                  spellCheck={false}
                  data-lpignore
                  containerProps={INPUT_CONTAINER_PROPS_PASSWORD}
                />
              </FormFieldContainer>
            </div>
            <Button
              icon={ArrowRight}
              fullWidth
              primary
              type="submit"
              className={classNames(
                "bg-fg-brand text-fg-primary-alt hover:bg-fg-brand/90 shadow-none",
                !isValid && "opacity-70",
              )}
              disabled={!isValid}
              processing={isSubmitting}
              data-testid="onboarding-password-confirm-button"
            >
              {t("Continue")}
            </Button>
          </form>
        </OnboardDialog>
        )}
      </div>
    </OnboardLayout>
  )
}
