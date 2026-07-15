import { classNames } from "@taostats-wallet/util"
import { DetailedHTMLProps, FC } from "react"

type ContainerProps = DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export const Container: FC<ContainerProps> = (props) => {
  return (
    <div
      {...props}
      className={classNames("bg-app-bg text-fg-secondary rounded", props.className)}
    />
  )
}
