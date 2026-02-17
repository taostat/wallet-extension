import { useMemo } from "react"

import type { ColdkeyReportItem } from "../portfolioApi"

export interface DualAxisData {
  date: Date
  leftValue: number
  rightValue: number
}

export const getDefaultMargin = (showTicks: boolean) =>
  showTicks
    ? { top: 40, right: 50, bottom: 40, left: 50 }
    : { top: 40, right: 0, bottom: 40, left: 0 }

export const colours = {
  green: "#00DBBC",
  red: "#EB5347",
}

const TAO_DECIMALS = 9

const getBadgePosition = (
  value: number,
  min: number,
  max: number,
  height: number,
  defaultMargin: ReturnType<typeof getDefaultMargin>,
) => {
  const range = max - min
  const valueMinusMin = value - min
  const percentagePosition = valueMinusMin / range
  const percentagePositionRemainder = 1 - percentagePosition
  const heightMinusMargins = height - defaultMargin.bottom - defaultMargin.top
  const positionPercentToHeightValue = percentagePositionRemainder * heightMinusMargins
  return positionPercentToHeightValue + 25
}

const upScale = (val: number, scale = 1.1) => val * scale
const downScale = (val: number, scale = 0.9) => val * scale
const SHOW_TICKS = false

const calculatePositionFactor = (axisVal: number, axisMin: number, axisMax: number) => {
  const amountOnChart = axisVal - axisMin
  const axisRange = axisMax - axisMin
  return amountOnChart / axisRange
}

export const useChartConfig = (data: DualAxisData[], chartHeight: number) => {
  const showTicks = SHOW_TICKS
  const defaultMargin = getDefaultMargin(showTicks)

  const rVals = useMemo(() => data.map((t) => t.rightValue), [data])
  const lVals = useMemo(() => data.map((t) => t.leftValue), [data])

  const chartConfig = useMemo(() => {
    const rightAxisMin = Math.min(...rVals)
    const rightAxisMax = Math.max(...rVals)
    const rightAxisMaxScale = upScale(rightAxisMax, 1.0001)
    const rightAxisMinScale = downScale(rightAxisMin, 0.9999)

    const leftAxisMin = Math.min(...lVals)
    const leftAxisMax = Math.max(...lVals)
    const leftAxisMaxScale = upScale(leftAxisMax, 1.0001)
    const leftAxisMinScale = downScale(leftAxisMin, 0.9999)

    const getRightValuePositionOnLeftAxis = (rightAxisVal: number) => {
      const rValPositionFactor = calculatePositionFactor(
        rightAxisVal,
        rightAxisMinScale,
        rightAxisMaxScale,
      )
      const leftRange = leftAxisMaxScale - leftAxisMinScale
      const rValAmountThroughLeftAxis = rValPositionFactor * leftRange
      const rValPositionOnLeftAxis = rValAmountThroughLeftAxis + leftAxisMinScale
      return { rValPositionOnLeftAxis, rValPositionFactor }
    }

    const {
      rValPositionOnLeftAxis: rValMaxPositionOnLeftAxis,
      rValPositionFactor: rValMaxPositionFactor,
    } = getRightValuePositionOnLeftAxis(rightAxisMax)
    const {
      rValPositionOnLeftAxis: rValMinPositionOnLeftAxis,
      rValPositionFactor: rValMinPositionFactor,
    } = getRightValuePositionOnLeftAxis(rightAxisMin)

    const rightValMaxBadgePosition = getBadgePosition(
      rValMaxPositionOnLeftAxis,
      leftAxisMinScale,
      leftAxisMaxScale,
      chartHeight,
      defaultMargin,
    )
    const rightValMinBadgePosition = getBadgePosition(
      rValMinPositionOnLeftAxis,
      leftAxisMinScale,
      leftAxisMaxScale,
      chartHeight,
      defaultMargin,
    )
    const leftValMaxBadgePosition = getBadgePosition(
      leftAxisMax,
      leftAxisMinScale,
      leftAxisMaxScale,
      chartHeight,
      defaultMargin,
    )
    const leftValMinBadgePosition = getBadgePosition(
      leftAxisMin,
      leftAxisMinScale,
      leftAxisMaxScale,
      chartHeight,
      defaultMargin,
    )

    const lValMinPositionFactor = calculatePositionFactor(
      leftAxisMin,
      leftAxisMinScale,
      leftAxisMaxScale,
    )
    const lValMaxPositionFactor = calculatePositionFactor(
      leftAxisMax,
      leftAxisMinScale,
      leftAxisMaxScale,
    )

    return {
      rightAxisMin,
      rightAxisMax,
      rightAxisMaxScale,
      rightAxisMinScale,
      leftAxisMin,
      leftAxisMax,
      leftAxisMaxScale,
      leftAxisMinScale,
      rValMaxPositionOnLeftAxis,
      rValMinPositionOnLeftAxis,
      rightValMaxBadgePosition,
      rightValMinBadgePosition,
      leftValMaxBadgePosition,
      leftValMinBadgePosition,
      getRightValuePositionOnLeftAxis,
      rValMinPositionFactor,
      lValMinPositionFactor,
      lValMaxPositionFactor,
      rValMaxPositionFactor,
    }
  }, [defaultMargin, chartHeight, lVals, rVals])

  return { chartConfig, showTicks, defaultMargin }
}

const toTao = (raoOrTao: string | number): number => {
  const n = Number(raoOrTao)
  return n > 1e12 ? n / 10 ** TAO_DECIMALS : n
}

export const useChartData = (
  coldkeyData: ColdkeyReportItem[],
  balanceTotalTao: number,
  balanceTotalUsd: number,
  height: number,
) => {
  const initialData = useMemo(() => {
    const reportData =
      coldkeyData
        ?.filter((report) => report.total_balance != null)
        .map((report) => {
          const taoBalance = toTao(report.total_balance ?? 0)
          const taoPrice = Number(report.tao_price ?? 0)
          const usdValue = taoPrice > 0 ? taoBalance * taoPrice : 0
          return {
            date: new Date(report.timestamp ?? report.date ?? 0),
            leftValue: usdValue,
            rightValue: taoBalance,
          }
        }) ?? []

    reportData.push({
      date: new Date(),
      leftValue: balanceTotalUsd,
      rightValue: balanceTotalTao,
    })

    return reportData
  }, [coldkeyData, balanceTotalTao, balanceTotalUsd])

  const { chartConfig, defaultMargin, showTicks } = useChartConfig(initialData, height)

  const data = useMemo(
    () =>
      initialData.map((datum) => ({
        ...datum,
        rightValueForPosition: chartConfig.getRightValuePositionOnLeftAxis(datum.rightValue)
          .rValPositionOnLeftAxis,
      })),
    [initialData, chartConfig],
  )

  return { data, chartConfig, defaultMargin, showTicks }
}
