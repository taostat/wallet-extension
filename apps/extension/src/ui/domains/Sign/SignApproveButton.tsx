import { FC, useMemo } from "react"
import { Button, ButtonProps, Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

export const SignApproveButton: FC<ButtonProps> = (props) => {
  const [disabled, tooltip] = useMemo(() => {
    if (props.disabled) {
      return [!!props.disabled, null]
    }

    return [false, null]
  }, [props.disabled])

  if (tooltip) {
    return (
      <Tooltip placement="top-end">
        <TooltipTrigger asChild>
          <div>
            <Button {...props} disabled={disabled} color="primary" fullWidth />
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return <Button {...props} disabled={disabled} color="primary" />
}
