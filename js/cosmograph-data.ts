import { scaleSequential } from 'd3-scale'
import { interpolateWarm } from 'd3-scale-chromatic'
import { CosmographConfig, CosmographDataPrepConfig, prepareCosmographData, CosmographInputData } from '@cosmograph/cosmograph'
import { duckDBNumericTypes, duckDBStringTypes } from './helper'

export type WidgetConfig = CosmographConfig & {
  pointTimelineBy?: string;
}

/**
 * Prepares and mutates the Cosmograph data configuration based on the provided `CosmographConfig`.
 */
export async function prepareCosmographDataAndMutate(config: WidgetConfig): Promise<void> {
  const hasLinks = config.links !== undefined && config.linkSourceBy !== undefined && config.linkTargetBy !== undefined
  const cosmographDataPrepConfig: CosmographDataPrepConfig = {
    points: {
      pointLabelBy: config.pointLabelBy,
      pointLabelWeightBy: config.pointLabelWeightBy,
      pointColor: config.pointColor,
      pointColorBy: config.pointColorBy,
      pointColorPalette: config.pointColorPalette,
      pointColorByMap: config.pointColorByMap,
      pointColorStrategy: config.pointColorStrategy,
      pointSize: config.pointSize,
      pointSizeBy: config.pointSizeBy,
      pointSizeStrategy: config.pointSizeStrategy,
      pointXBy: config.pointXBy,
      pointYBy: config.pointYBy,
      pointClusterBy: config.pointClusterBy,
      pointClusterStrengthBy: config.pointClusterStrengthBy,
      pointIncludeColumns: config.pointIncludeColumns,
    },
  }

  if (config.pointTimelineBy) {
    if (!cosmographDataPrepConfig.points.pointIncludeColumns) cosmographDataPrepConfig.points.pointIncludeColumns = []
    cosmographDataPrepConfig.points.pointIncludeColumns.push(config.pointTimelineBy)
  }

  if (config.points !== undefined) {
    cosmographDataPrepConfig.points.pointIdBy = config.pointIdBy
  } else if (hasLinks) {
    cosmographDataPrepConfig.points.linkSourceBy = config.linkSourceBy
    cosmographDataPrepConfig.points.linkTargetsBy = [config.linkTargetBy as string]
  }

  if (hasLinks) {
    cosmographDataPrepConfig.links = {
      linkSourceBy: config.linkSourceBy as string,
      linkTargetsBy: [config.linkTargetBy as string],
      linkColorBy: config.linkColorBy,
      linkWidthBy: config.linkWidthBy,
      linkArrowBy: config.linkArrowBy,
      linkStrengthBy: config.linkStrengthBy,
      linkIncludeColumns: config.linkIncludeColumns,
    }
  }

  const hasLinksOnly = config.points === undefined && hasLinks
  const preparedDataArrow = await prepareCosmographData(
    cosmographDataPrepConfig,
    hasLinksOnly ? (config.links as CosmographInputData) : (config.points as CosmographInputData),
    config.links
  )

  Object.assign(config, preparedDataArrow?.cosmographConfig, {
    points: preparedDataArrow?.points,
    links: preparedDataArrow?.links,
  })

  // TODO: Remove this logic after Dasha fix it in Cosmograph
  if (config.pointLabelBy !== undefined && config.showLabels === undefined) {
    config.showLabels = true
    config.showDynamicLabels = true
  }

  // Temporary fix for Cosmograph simulation config parameters for small graphs
  if (preparedDataArrow?.points?.numRows !== undefined && preparedDataArrow?.points?.numRows < 50 && config.simulationGravity === undefined) {
    config.simulationGravity = 0
  }
  if (preparedDataArrow?.points?.numRows !== undefined && preparedDataArrow?.points?.numRows < 50 && config.simulationCenter === undefined) {
    config.simulationCenter = 1
  }
  if (preparedDataArrow?.points?.numRows !== undefined && preparedDataArrow?.points?.numRows < 50 && config.simulationDecay === undefined) {
    config.simulationDecay = 1000
  }
}

export function getPointColorLegendType(pointsSummary?: Record<string, unknown>[], config?: CosmographConfig): 'range' | 'type' | undefined {
  const pointColorInfo = pointsSummary?.find(d => d.column_name === config?.pointColorBy)
  if (config?.pointColorStrategy === 'degree' || (pointColorInfo && duckDBNumericTypes.includes(pointColorInfo.column_type as string))) {
    return 'range'
  } else if (pointColorInfo && duckDBStringTypes.includes(pointColorInfo.column_type as string)) {
    return 'type'
  }
  return undefined
}

export function updateLinkColorFn(linksSummary: Record<string, unknown>[], cosmographConfig: CosmographConfig): void {
  const linkColorInfo = linksSummary.find(d => d.column_name === cosmographConfig.linkColorBy)
  if (linkColorInfo && duckDBNumericTypes.includes(linkColorInfo.column_type as string)) {
    const linkColorScale = scaleSequential(interpolateWarm)
    linkColorScale.domain([Number(linkColorInfo.min), Number(linkColorInfo.max)])
    cosmographConfig.linkColorByFn = (d: number) => linkColorScale(d)
  } else {
    cosmographConfig.linkColorByFn = undefined
  }
  // TODO: If the data is of category type, use `CosmographTypeColorLegend`
}

// TODO: Remove this code when Cosmograph exports the `getPointColorStrategy` function
enum PointColorStrategy {
  Palette = 'palette',
  InterpolatePalette = 'interpolatePalette',
  Map = 'map',
  Degree = 'degree'
}

type PointColorStrategyType = `${PointColorStrategy}`

export function getPointColorStrategy(
  cosmographConfig: CosmographConfig,
  summary?: Record<string, unknown>[]
): PointColorStrategyType | undefined {
  const { pointColorBy, pointColor } = cosmographConfig

  // Priority 1: Use existing strategy if defined
  if (cosmographConfig.pointColorStrategy) return cosmographConfig.pointColorStrategy
  // Priority 2: Custom function takes precedence
  if (cosmographConfig.pointColorByFn || cosmographConfig.pointColor) return undefined
  // Priority 3: Map-based coloring
  if (cosmographConfig.pointColorByMap) return PointColorStrategy.Map

  if (!pointColor && !pointColorBy) {
    // Use degree-based coloring if links are present and no {@link pointColorBy} column
    return cosmographConfig.linkSourceBy ? PointColorStrategy.Degree : undefined
  }

  // Apply `interpolatePalette` if {@link pointColorBy} contains numeric values
  const columnType = summary?.find(k => k.column_name === pointColorBy)?.column_type
  if (columnType === 'DOUBLE' || columnType === 'INTEGER') {
    return PointColorStrategy.InterpolatePalette
  }

  return undefined
}

// TODO: Remove this code when Cosmograph exports the `getPointSizeStrategy` function
export enum PointSizeStrategy {
  Degree = 'degree',
  Auto = 'auto'
}

export type PointSizeStrategyType = `${PointSizeStrategy}`

export function getPointSizeStrategy(
  cosmographConfig: CosmographConfig,
  summary?: Record<string, unknown>[]
): PointSizeStrategyType | undefined {
  const { pointSizeBy, pointSize } = cosmographConfig

  // Priority 1: Use existing strategy if defined
  if (cosmographConfig.pointSizeStrategy) return cosmographConfig.pointSizeStrategy
  // Priority 2: Custom function takes precedence
  if (cosmographConfig.pointSizeByFn || cosmographConfig.pointSize) return undefined

  if (!pointSize && !pointSizeBy) {
    // Use degree-based coloring if links are present and no {@link pointSizeBy} column
    return cosmographConfig.linkSourceBy ? PointSizeStrategy.Degree : undefined
  }

  // Apply `auto` if contains numeric values
  const columnType = summary?.find(k => k.column_name === pointSizeBy)?.column_type
  if (columnType === 'DOUBLE' || columnType === 'INTEGER') {
    return PointSizeStrategy.Auto
  }

  return undefined
}
