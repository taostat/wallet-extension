import { FC } from "react"

export const SupportOpsCtaButton: FC<{
  title: string
  description: string
  onClick: () => void
}> = ({ title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="border-primary bg-app-bg hover:bg-secondary flex flex-col gap-4 rounded border p-10 text-left"
  >
    <div className="text-md font-bold">{title}</div>
    <p className="text-fg-secondary">{description}</p>
  </button>
)
