import { CosmographConfig, CosmographDataPrepConfig, prepareCosmographData, CosmographInputData } from '@cosmograph/cosmograph'

export type WidgetConfig = CosmographConfig & {
  timelineBy?: string;
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
      pointColorBy: config.pointColorBy,
      pointSizeBy: config.pointSizeBy,
      pointXBy: config.pointXBy,
      pointYBy: config.pointYBy,
      pointClusterBy: config.pointClusterBy,
      pointClusterStrengthBy: config.pointClusterStrengthBy,
      pointIncludeColumns: config.pointIncludeColumns,
    },
  }

  if (config.timelineBy) {
    cosmographDataPrepConfig.points.pointIncludeColumns?.push(config.timelineBy)
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
