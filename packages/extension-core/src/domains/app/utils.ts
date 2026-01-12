export class TaostatsNotOnboardedError extends Error {
  constructor() {
    super("Taostats wallet extension has not been configured yet. Please continue with onboarding.")
  }
}
