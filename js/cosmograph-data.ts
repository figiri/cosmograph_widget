import { CosmographConfig, CosmographDataPrepConfig, prepareCosmographDataArrow, CosmographInputData } from '@cosmograph/cosmograph'

/**
 * Prepares and mutates the Cosmograph data configuration based on the provided `CosmographConfig`.
 */
export async function prepareCosmographDataAndMutate(config: CosmographConfig): Promise<void> {
  const hasLinks = config.links !== undefined && config.linkSource !== undefined && config.linkTarget !== undefined
  const cosmographDataPrepConfig: CosmographDataPrepConfig = {
    points: {
      pointLabel: config.pointLabel,
      pointLabelWeight: config.pointLabelWeight,
      pointColor: config.pointColor,
      pointSize: config.pointSize,
      pointX: config.pointX,
      pointY: config.pointY,
      pointIncludeColumns: config.pointIncludeColumns,
    },
  }

  if (config.points !== undefined) {
    cosmographDataPrepConfig.points.pointId = config.pointId
  } else if (hasLinks) {
    cosmographDataPrepConfig.points.linkSource = config.linkSource
    cosmographDataPrepConfig.points.linkTargets = [config.linkTarget as string]
  }

  if (hasLinks) {
    cosmographDataPrepConfig.links = {
      linkSource: config.linkSource as string,
      linkTargets: [config.linkTarget as string],
      linkColor: config.linkColor,
      linkWidth: config.linkWidth,
      linkArrow: config.linkArrow,
      linkStrength: config.linkStrength,
      linkIncludeColumns: config.linkIncludeColumns,
    }
  }

  const hasLinksOnly = config.points === undefined && hasLinks
  const preparedDataArrow = await prepareCosmographDataArrow(
    cosmographDataPrepConfig,
    hasLinksOnly ? (config.links as CosmographInputData) : (config.points as CosmographInputData),
    config.links
  )

  Object.assign(config, preparedDataArrow?.cosmographConfig, {
    points: preparedDataArrow?.points,
    links: preparedDataArrow?.links,
  })
}
