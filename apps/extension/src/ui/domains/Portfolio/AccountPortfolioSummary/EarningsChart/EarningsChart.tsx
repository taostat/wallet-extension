import type { TooltipData } from "@visx/xychart"
import { AxisRight } from "@visx/axis"
import { curveMonotoneX } from "@visx/curve"
import { LinearGradient } from "@visx/gradient"
import { ParentSize } from "@visx/responsive"
import { scaleLinear } from "@visx/scale"
import { defaultStyles as tooltipDefaultStyles } from "@visx/tooltip"
import { AreaSeries, Axis, Grid, LineSeries, Tooltip, XYChart } from "@visx/xychart"
import { classNames } from "@taostats-wallet/util"
import { memo, useCallback } from "react"
import { CHART_COLORS } from "taostats-ui"

import { useTokenRatesMap } from "@ui/state"

import type { DualAxisData } from "./chartUtils"
import { formatNumber } from "../utils"
import { colours, useChartData } from "./chartUtils"

const TAO_TOKEN_ID = "bittensor:substrate-dtao:0"

const dataKeys = {
  leftValueArea: "Left Value Area",
  rightValueArea: "Right Value Area",
  upperLeftThreshold: "Upper Left Threshold",
  upperRightThreshold: "Upper Right Threshold",
  lowerRightThreshold: "Lower Right Threshold",
  lowerLeftThreshold: "Lower Left Threshold",
} as const

const useTooltipRenderer = () =>
  useCallback(({ tooltipData }: { tooltipData?: TooltipData }) => {
    const date = (
      tooltipData?.datumByKey[dataKeys.leftValueArea]?.datum as DualAxisData | undefined
    )?.date
    const leftValue = (
      tooltipData?.datumByKey[dataKeys.leftValueArea]?.datum as DualAxisData | undefined
    )?.leftValue
    const rightValue = (
      tooltipData?.datumByKey[dataKeys.rightValueArea]?.datum as DualAxisData | undefined
    )?.rightValue

    if (!date || leftValue == null || rightValue == null) return null

    return (
      <div className="bg-tooltip-bg min-w-[150px] rounded-lg px-2.5 py-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-center gap-1">
            <div className="bg-accent-1 h-1.5 w-1.5 rounded-sm" />
            <span className="text-fg-secondary text-sm">τ{formatNumber(rightValue)}</span>
          </div>
          <div className="flex flex-row items-center gap-1">
            <div className="bg-accent-2 h-1.5 w-1.5 rounded-sm" />
            <span className="text-fg-secondary text-sm">${formatNumber(leftValue)}</span>
          </div>
          <div className="text-fg-tertiary text-xs">
            {date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    )
  }, [])

type EarningsChartProps = {
  coldkeyData: import("../portfolioApi").ColdkeyReportItem[]
  balanceTotalTao: number
  isLoading: boolean
  isError: boolean
  /** When true, omit outer card chrome (parent SurfaceCard provides it). */
  embedded?: boolean
}

export const EarningsChart = memo(function EarningsChart({
  coldkeyData,
  balanceTotalTao,
  isLoading,
  isError,
  embedded = false,
}: EarningsChartProps) {
  const tokenRates = useTokenRatesMap()
  const taoUsdPrice = tokenRates?.[TAO_TOKEN_ID]?.usd?.price ?? 0
  const balanceTotalUsd = balanceTotalTao * taoUsdPrice

  if (isLoading) {
    return (
      <div
        className={classNames(
          "flex min-h-[200px] w-full animate-pulse items-center justify-center",
          !embedded && "bg-secondary rounded-lg",
        )}
      />
    )
  }

  if (isError) {
    return (
      <div
        className={classNames(
          "flex min-h-[200px] w-full flex-col items-center justify-center gap-2 p-4",
          !embedded && "bg-secondary rounded-lg",
        )}
      >
        <p className="text-fg-secondary text-center text-sm">
          An error occurred while loading the earnings chart.
        </p>
      </div>
    )
  }

  return (
    <div
      className={classNames(
        "h-full min-h-[220px] w-full overflow-hidden p-0 [&_svg]:!h-full [&_svg]:!w-full",
        !embedded && "bg-secondary rounded-lg",
        embedded && "h-[260px]",
      )}
    >
      <ParentSize>
        {({ width, height }) =>
          width > 0 && height > 0 ? (
            <ChartInner
              width={width}
              height={height}
              coldkeyData={coldkeyData}
              balanceTotalTao={balanceTotalTao}
              balanceTotalUsd={balanceTotalUsd}
            />
          ) : null
        }
      </ParentSize>
    </div>
  )
})

const ChartInner = memo(function ChartInner({
  width,
  height,
  coldkeyData,
  balanceTotalTao,
  balanceTotalUsd,
}: {
  width: number
  height: number
  coldkeyData: import("../portfolioApi").ColdkeyReportItem[]
  balanceTotalTao: number
  balanceTotalUsd: number
}) {
  const { data, chartConfig, defaultMargin, showTicks } = useChartData(
    coldkeyData,
    balanceTotalTao,
    balanceTotalUsd,
    height,
  )
  const handleRenderTooltip = useTooltipRenderer()

  return (
    <div>
      <XYChart
        width={width}
        height={height}
        xScale={{ type: "time" }}
        yScale={{
          type: "linear",
          domain: [chartConfig.leftAxisMinScale, chartConfig.leftAxisMaxScale],
          zero: false,
        }}
        margin={defaultMargin}
      >
        <Grid
          columns={false}
          numTicks={5}
          lineStyle={{
            strokeOpacity: 0.1,
            strokeWidth: 0.5,
            stroke: CHART_COLORS.gridLine,
          }}
        />
        <Axis
          orientation="bottom"
          hideAxisLine={false}
          axisLineClassName="stroke-fg-primary/10"
          hideTicks
          numTicks={5}
          tickFormat={(date) =>
            (date as Date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
        />
        <Axis
          hideAxisLine
          hideTicks
          orientation="left"
          tickLabelProps={{ fill: CHART_COLORS.foreground, fontSize: 11, opacity: 0.5 }}
          tickFormat={(value) =>
            showTicks
              ? `$${(value as number).toLocaleString("en-US", {
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 1,
                })}`
              : ""
          }
        />
        <AxisRight
          hideAxisLine
          left={width - 49}
          top={defaultMargin.top}
          scale={scaleLinear<number>({
            domain: [chartConfig.rightAxisMinScale, chartConfig.rightAxisMaxScale],
            range: [height - defaultMargin.top - defaultMargin.bottom, 0],
          })}
          tickFormat={(value) =>
            showTicks
              ? (value as number).toLocaleString("en-US", {
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 3,
                })
              : ""
          }
          hideTicks
          tickLabelProps={{ fill: CHART_COLORS.foreground, fontSize: 11, opacity: 0.5 }}
        />

        <LinearGradient
          id="earnings-left-area-gradient"
          from={colours.red}
          to={colours.red}
          fromOpacity={0.2}
          toOpacity={0}
        />
        <AreaSeries
          dataKey={dataKeys.leftValueArea}
          data={data}
          xAccessor={(d) => d.date}
          yAccessor={(d) => d.leftValue}
          fill="url(#earnings-left-area-gradient)"
          curve={curveMonotoneX}
          lineProps={{ strokeWidth: 2, stroke: colours.red }}
        />

        <LinearGradient
          id="earnings-right-area-gradient"
          from={colours.green}
          to={colours.green}
          fromOpacity={0.2}
          toOpacity={0}
        />
        <AreaSeries
          dataKey={dataKeys.rightValueArea}
          data={data}
          xAccessor={(d) => d.date}
          yAccessor={(d) =>
            (d as DualAxisData & { rightValueForPosition: number }).rightValueForPosition
          }
          fill="url(#earnings-right-area-gradient)"
          curve={curveMonotoneX}
          lineProps={{ strokeWidth: 2, stroke: colours.green }}
        />

        <LineSeries
          dataKey={dataKeys.upperLeftThreshold}
          data={data.map((d) => ({
            date: d.date,
            value: chartConfig.leftAxisMax,
          }))}
          xAccessor={(d) => d.date}
          yAccessor={(d) => d.value}
          stroke={colours.red}
          strokeWidth={1.5}
          strokeDasharray="3,6"
        />

        <LineSeries
          dataKey={dataKeys.upperRightThreshold}
          data={data.map((d) => ({
            date: d.date,
            value: chartConfig.rValMaxPositionOnLeftAxis,
          }))}
          xAccessor={(d) => d.date}
          yAccessor={(d) => d.value}
          stroke={colours.green}
          strokeWidth={1.5}
          strokeDasharray="3,6"
        />

        {chartConfig.rValMinPositionFactor > 0.02 && (
          <LineSeries
            dataKey={dataKeys.lowerRightThreshold}
            data={data.map((d) => ({
              date: d.date,
              value: chartConfig.rValMinPositionOnLeftAxis,
            }))}
            xAccessor={(d) => d.date}
            yAccessor={(d) => d.value}
            stroke={colours.green}
            strokeWidth={1.5}
            strokeDasharray="3,6"
          />
        )}

        {chartConfig.lValMinPositionFactor > 0.02 && (
          <LineSeries
            dataKey={dataKeys.lowerLeftThreshold}
            data={data.map((d) => ({
              date: d.date,
              value: chartConfig.leftAxisMin,
            }))}
            xAccessor={(d) => d.date}
            yAccessor={(d) => d.value}
            stroke={colours.red}
            strokeWidth={1.5}
            strokeDasharray="3,6"
          />
        )}

        <g
          transform={`translate(${showTicks ? width - defaultMargin.right - 85 : width - 90}, ${chartConfig.rightValMaxBadgePosition})`}
        >
          <foreignObject width={100} height={24}>
            <span className="bg-app-bg inline-block rounded">
              <span className="bg-accent-1/20 text-accent-1 inline-block rounded px-1 py-px text-xs">
                τ
                {chartConfig.rightAxisMax.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </foreignObject>
        </g>
        <g
          transform={`translate(${showTicks ? width - defaultMargin.right - 85 : width - 90}, ${chartConfig.rightValMinBadgePosition})`}
        >
          <foreignObject width={100} height={24}>
            <span className="bg-app-bg inline-block rounded">
              <span className="bg-accent-1/10 text-accent-1 inline-block rounded px-1 py-px text-xs">
                τ
                {chartConfig.rightAxisMin.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </foreignObject>
        </g>
        <g
          transform={`translate(${showTicks ? defaultMargin.left + 20 : 10}, ${chartConfig.leftValMaxBadgePosition})`}
        >
          <foreignObject width={200} height={24}>
            <span className="bg-app-bg inline-block rounded">
              <span className="bg-accent-2/20 text-accent-2 inline-block rounded px-1 py-px text-xs">
                $
                {chartConfig.leftAxisMax.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </foreignObject>
        </g>
        <g
          transform={`translate(${showTicks ? defaultMargin.left + 20 : 10}, ${chartConfig.leftValMinBadgePosition})`}
        >
          <foreignObject width={200} height={24}>
            <span className="bg-app-bg inline-block rounded">
              <span className="bg-accent-2/10 text-accent-2 inline-block rounded px-1 py-px text-xs">
                $
                {chartConfig.leftAxisMin.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </foreignObject>
        </g>

        <Tooltip
          style={{
            ...tooltipDefaultStyles,
            opacity: 0.8,
            backdropFilter: "blur(23.8px)",
            backgroundColor: CHART_COLORS.tooltipBackground,
            borderRadius: "8px",
            padding: "10px",
            zIndex: 9999,
          }}
          showVerticalCrosshair
          verticalCrosshairStyle={{
            stroke: "rgba(255,255,255,0.75)",
            strokeWidth: 2,
            strokeDasharray: "5 3",
          }}
          renderTooltip={handleRenderTooltip}
          showSeriesGlyphs
          renderGlyph={({ key }) => {
            if (key === dataKeys.leftValueArea || key === dataKeys.rightValueArea) {
              return (
                <circle
                  r={4}
                  fill={key === dataKeys.leftValueArea ? colours.red : colours.green}
                  stroke={CHART_COLORS.foreground}
                  strokeWidth={2}
                />
              )
            }
            return null
          }}
        />
      </XYChart>
    </div>
  )
})
