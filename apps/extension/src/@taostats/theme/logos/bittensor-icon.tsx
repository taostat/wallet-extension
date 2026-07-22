import { classNames } from "@taostats-wallet/util"
import type { SVGProps } from "react"

export function BittensorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 160"
      fill="currentColor"
      {...props}
    >
      <title>Bittensor</title>
      <path d="M74.511826,141.389801 C69.902260,134.429306 68.814674,127.102524 68.894516,119.200371 C69.153793,93.540993 68.991470,67.877365 68.991470,42.215370 C68.991470,40.400177 68.991470,38.584984 68.991470,36.250793 C51.649651,36.250793 34.582787,36.250793 17.585863,36.250793 C16.242144,25.488571 25.326321,14.685592 36.651352,13.071257 C38.787991,12.766686 40.967152,12.637870 43.126865,12.636084 C75.620926,12.609209 108.115021,12.614027 140.609100,12.628672 C141.905731,12.629255 143.202316,12.800948 144.454651,12.889777 C145.576370,25.474287 132.468872,36.151722 121.263863,36.042240 C106.768761,35.900608 92.271233,36.007694 76.569313,36.007694 C78.315765,37.259892 79.175049,38.061272 80.182274,38.569382 C89.798012,43.420158 94.298233,51.428394 94.365379,61.967274 C94.475815,79.296745 94.381798,96.627457 94.410576,113.957588 C94.415550,116.951462 94.694855,119.945274 94.687103,122.938698 C94.659332,133.670609 98.105026,141.914841 110.143463,144.120453 C100.946335,151.150513 83.820618,149.829880 74.511826,141.389801 z" />
    </svg>
  )
}

type BittensorIconThemedProps = SVGProps<SVGSVGElement> & {
  width?: number | string
  height?: number | string
}

/** Circular icon treatment matching monorepo `TaoIconThemed` (dark UI). */
export function BittensorIconThemed({
  className,
  width,
  height,
  ...props
}: BittensorIconThemedProps) {
  const size = width ?? height
  const cssSize =
    size != null ? (typeof size === "number" ? `${size}px` : size) : null

  return (
    <div
      className={classNames(
        "bg-primary inline-flex shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={
        cssSize != null
          ? {
              width: cssSize,
              height: cssSize,
              padding: `calc(${cssSize} * 0.2)`,
            }
          : undefined
      }
    >
      <BittensorIcon
        {...props}
        width={cssSize != null ? "100%" : undefined}
        height={cssSize != null ? "100%" : undefined}
        className="text-fg-primary"
      />
    </div>
  )
}
