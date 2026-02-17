import { useCallback, memo } from "react"
import { AxisRight } from "@visx/axis"
import { curveMonotoneX } from "@visx/curve"
import { LinearGradient } from "@visx/gradient"
import { ParentSize } from "@visx/responsive"
import { scaleLinear } from "@visx/scale"
import { defaultStyles as tooltipDefaultStyles } from "@visx/tooltip"
import {
  XYChart,
  Axis,
  LineSeries,
  AreaSeries,
  Grid,
  Tooltip,
  type TooltipData,
} from "@visx/xychart"

import { useTokenRatesMap } from "@ui/state"

import type { DualAxisData } from "./chartUtils"
import { colours, useChartData } from "./chartUtils"

const TAO_TOKEN_ID = "bittensor:substrate-dtao:0"

const formatNumber2dp = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const dataKeys = {
  leftValueArea: "Left Value Area",
  rightValueArea: "Right Value Area",
  upperLeftThreshold: "Upper Left Threshold",
  upperRightThreshold: "Upper Right Threshold",
  lowerRightThreshold: "Lower Right Threshold",
  lowerLeftThreshold: "Lower Left Threshold",
} as const

const useTooltipRenderer = () =>
  useCallback(
    ({ tooltipData }: { tooltipData?: TooltipData }) => {
      const date = (
        tooltipData?.datumByKey[dataKeys.leftValueArea]?.datum as
          | DualAxisData
          | undefined
      )?.date
      const leftValue = (
        tooltipData?.datumByKey[dataKeys.leftValueArea]?.datum as
          | DualAxisData
          | undefined
      )?.leftValue
      const rightValue = (
        tooltipData?.datumByKey[dataKeys.rightValueArea]?.datum as
          | DualAxisData
          | undefined
      )?.rightValue

      if (!date || leftValue == null || rightValue == null) return null

      return (
        <div className="min-w-[15rem] rounded-lg bg-[#1d1d1d] px-5 py-3">
          <div className="flex flex-col gap-2">
            <div className="text-body-secondary text-sm">
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="flex flex-row items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: colours.green }}
              />
              <span className="text-body-secondary text-sm">
                {formatNumber2dp(rightValue)} t
              </span>
            </div>
            <div className="flex flex-row items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: colours.red }}
              />
              <span className="text-body-secondary text-sm">
                ${formatNumber2dp(leftValue)}
              </span>
            </div>
          </div>
        </div>
      )
    },
    [],
  )

type EarningsChartProps = {
  coldkeyData: import("../portfolioApi").ColdkeyReportItem[]
  balanceTotalTao: number
  isLoading: boolean
  isError: boolean
}

export const EarningsChart = memo(function EarningsChart({
  coldkeyData,
  balanceTotalTao,
  isLoading,
  isError,
}: EarningsChartProps) {
  const tokenRates = useTokenRatesMap()
  const taoUsdPrice = tokenRates?.[TAO_TOKEN_ID]?.usd?.price ?? 0
  const balanceTotalUsd = balanceTotalTao * taoUsdPrice

  if (isLoading) {
    return (
      <div className="bg-grey-800 flex min-h-[200px] w-full animate-pulse items-center justify-center rounded-lg" />
    )
  }

  if (isError) {
    return (
      <div className="bg-grey-800 flex min-h-[200px] w-full flex-col items-center justify-center gap-4 rounded-lg p-8">
        <p className="text-body-secondary text-center text-sm">
          An error occurred while loading the earnings chart.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-grey-800 h-full min-h-[200px] w-full overflow-hidden rounded-lg p-0">
      <ParentSize>
        {({ width, height }) => (
          <ChartInner
            width={width}
            height={height}
            coldkeyData={coldkeyData}
            balanceTotalTao={balanceTotalTao}
            balanceTotalUsd={balanceTotalUsd}
          />
        )}
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

  if (data.length < 2) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-body-secondary text-center text-sm">
          Not enough data to display the chart.
        </p>
      </div>
    )
  }

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
            stroke: "#FFFFFF",
          }}
        />
        <Axis
          orientation="bottom"
          hideAxisLine={false}
          axisLineClassName="stroke-[#ffffff]/10"
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
          tickLabelProps={{ fill: "#888", fontSize: 11 }}
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
            domain: [
              chartConfig.rightAxisMinScale,
              chartConfig.rightAxisMaxScale,
            ],
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
          tickLabelProps={{ fill: "#888", fontSize: 11 }}
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
          yAccessor={(d) => (d as DualAxisData & { rightValueForPosition: number }).rightValueForPosition}
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
            <span className="bg-accent-1/20 text-accent-1 inline-block rounded px-2 py-0.5 text-xs">
              {chartConfig.rightAxisMax.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              t
            </span>
          </foreignObject>
        </g>
        <g
          transform={`translate(${showTicks ? width - defaultMargin.right - 85 : width - 90}, ${chartConfig.rightValMinBadgePosition})`}
        >
          <foreignObject width={100} height={24}>
            <span className="bg-accent-1/10 text-accent-1 inline-block rounded px-2 py-0.5 text-xs opacity-60">
              {chartConfig.rightAxisMin.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              t
            </span>
          </foreignObject>
        </g>
        <g
          transform={`translate(${showTicks ? defaultMargin.left + 20 : 10}, ${chartConfig.leftValMaxBadgePosition})`}
        >
          <foreignObject width={200} height={24}>
            <span className="bg-accent-2/20 text-accent-2 inline-block rounded px-2 py-0.5 text-xs">
              $
              {chartConfig.leftAxisMax.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </foreignObject>
        </g>
        <g
          transform={`translate(${showTicks ? defaultMargin.left + 20 : 10}, ${chartConfig.leftValMinBadgePosition})`}
        >
          <foreignObject width={200} height={24}>
            <span className="bg-accent-2/10 text-accent-2 inline-block rounded px-2 py-0.5 text-xs opacity-60">
              $
              {chartConfig.leftAxisMin.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </foreignObject>
        </g>

        <Tooltip
          style={{
            ...tooltipDefaultStyles,
            opacity: 0.8,
            backdropFilter: "blur(23.8px)",
            backgroundColor: "#1d1d1d",
            borderRadius: "8px",
            padding: "10px",
          }}
          showVerticalCrosshair
          verticalCrosshairStyle={{ strokeDasharray: "5 3" }}
          renderTooltip={handleRenderTooltip}
          showSeriesGlyphs
          renderGlyph={({ key }) => {
            if (
              key === dataKeys.leftValueArea ||
              key === dataKeys.rightValueArea
            ) {
              return (
                <circle
                  r={4}
                  fill={key === dataKeys.leftValueArea ? colours.red : colours.green}
                  stroke="white"
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
