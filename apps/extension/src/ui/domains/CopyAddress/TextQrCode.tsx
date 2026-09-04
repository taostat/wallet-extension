import QrCodeStyling from "@solana/qr-code-styling"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { taostatsLogoSvg } from "../Sign/Qr/constants"

/** Brand teal — matches `--fg-brand` / `#00DBBC`. */
export const QR_BRAND_COLOR = "#00DBBC"

export const TextQrCode = ({
  data,
  image = taostatsLogoSvg,
  imageOptions = {},
  moduleStyle,
  cornersColor,
  dotsColor,
}: {
  data?: string
  /** Pass `null` to omit the centre logo (better for dense payloads). */
  image?: string | null
  imageOptions?: {
    hideBackgroundDots?: boolean | undefined
    imageSize?: number | undefined
    crossOrigin?: string | undefined
    margin?: number | undefined
  }
  /** Defaults to dots with a logo, square without. Use `square` for denser payloads. */
  moduleStyle?: "dots" | "square"
  /** Colour for the three finder patterns (outer square + inner eye). */
  cornersColor?: string
  /** Colour for data modules. Keep dark for scan reliability. */
  dotsColor?: string
}) => {
  const [qrCode, setQrCode] = useState<string>()
  const [error, setError] = useState<Error>()
  const { t } = useTranslation()
  const hasImage = typeof image === "string" && image.length > 0
  const useSquareModules = (moduleStyle ?? (hasImage ? "dots" : "square")) === "square"

  useEffect(() => {
    if (!data) return
    else setError(undefined)

    try {
      const styling = new QrCodeStyling({
        type: "svg",
        data,
        margin: 0,
        dotsOptions: {
          type: useSquareModules ? "square" : "dots",
          ...(dotsColor ? { color: dotsColor } : {}),
        },
        cornersSquareOptions: {
          type: useSquareModules ? "square" : "extra-rounded",
          ...(cornersColor ? { color: cornersColor } : {}),
        },
        cornersDotOptions: {
          type: useSquareModules ? "square" : "dot",
          ...(cornersColor ? { color: cornersColor } : {}),
        },
        qrOptions: {
          // Logo covers modules — keep higher EC when present.
          errorCorrectionLevel: hasImage ? "H" : "M",
        },
        ...(hasImage
          ? {
              image,
              imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.25,
                margin: 4,
                ...imageOptions,
              },
            }
          : {}),
      })

      styling
        .getRawData("svg")
        .then((blob) => {
          if (blob) setQrCode(URL.createObjectURL(blob))
        })
        .catch(setError)
    } catch (err) {
      setError(err as Error)
    }
  }, [cornersColor, data, dotsColor, hasImage, image, imageOptions, useSquareModules])

  useEffect(() => {
    if (!error) return
    // eslint-disable-next-line no-console
    console.error("Failed to generate QR code", error, { data })
  }, [data, error])

  if (error)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-fg-error relative flex h-full w-full flex-col items-center justify-center whitespace-pre-wrap bg-white">
            {t("Failed to generate QR")}
          </div>
        </TooltipTrigger>
        <TooltipContent>{error.toString()}</TooltipContent>
      </Tooltip>
    )
  if (!qrCode) return null

  // apply a key to prevent flickering of inner icon if changing chain
  return (
    <img
      key={`${data}-${image ?? "none"}-${useSquareModules ? "square" : "dots"}-${cornersColor ?? "default"}`}
      className="relative h-full w-full"
      src={qrCode}
      alt=""
    />
  )
}
