import { renderHook, waitFor } from "@testing-library/react"
import { DEFAULT_APP_STATE } from "extension-core"
import { expect, test } from "vitest"

import { TestWrapper } from "../../../../tests/TestWrapper"
import { useAppState } from "../../state"

test("Can get analyticsRequestShown appState data", async () => {
  const { result } = renderHook(() => useAppState("analyticsRequestShown"), {
    wrapper: TestWrapper,
  })
  await waitFor(() => expect(result.current[0]).toBe(DEFAULT_APP_STATE.analyticsRequestShown))
})

test("Can get hasBraveWarningBeenShown appState data", async () => {
  const { result } = renderHook(() => useAppState("hasBraveWarningBeenShown"), {
    wrapper: TestWrapper,
  })
  await waitFor(() => expect(result.current[0]).toBe(DEFAULT_APP_STATE.hasBraveWarningBeenShown))
})

test("Can get hideBackupWarningUntil appState data", async () => {
  const { result } = renderHook(() => useAppState("hideBackupWarningUntil"), {
    wrapper: TestWrapper,
  })
  await waitFor(() => expect(result.current[0]).toBe(DEFAULT_APP_STATE.hideBackupWarningUntil))
})

test("Can get hideBraveWarning appState data", async () => {
  const { result } = renderHook(() => useAppState("hideBraveWarning"), {
    wrapper: TestWrapper,
  })
  await waitFor(() => expect(result.current[0]).toBe(DEFAULT_APP_STATE.hideBraveWarning))
})

test("A fresh install is not onboarded", async () => {
  const { result } = renderHook(() => useAppState("onboarded"), {
    wrapper: TestWrapper,
  })
  // AppStore.init() turns the default UNKNOWN into FALSE, so the onboarding page shows
  expect(DEFAULT_APP_STATE.onboarded).toBe("UNKNOWN")
  await waitFor(() => expect(result.current[0]).toBe("FALSE"))
})
