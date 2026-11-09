import { FC } from "react"

export const SupportOpsCtaButton: FC<{
  title: string
  description: string
  onClick: () => void
}> = ({ title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="border-primary bg-app-bg hover:bg-secondary flex flex-col gap-2 rounded border p-5 text-left"
  >
    <div className="text-md font-bold">{title}</div>
    <p className="text-fg-secondary">{description}</p>
  </button>
)
