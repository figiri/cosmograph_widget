import type { RenderProps } from '@anywidget/types'
import { Cosmograph, CosmographConfig } from '@cosmograph/cosmograph'
import { tableFromIPC, Table } from 'apache-arrow'
import { scaleSequential } from 'd3-scale'
import { interpolateWarm } from 'd3-scale-chromatic'
import { color } from 'd3-color'

import { subscribe, toCamelCase, duckDBNumericTypes, duckDBStringTypes } from './helper'
import { configProperties } from './config-props'
import { createWidgetContainer } from './widget-elements'
import { prepareCosmographDataAndMutate } from './cosmograph-data'
import { CosmographLegends } from './legends'
import { PointTimeline } from './components/point-timeline'
import { ControlButtonsComponent } from './components/control-buttons'

import './widget.css'

async function render({ model, el }: RenderProps) {
  const { graphContainer, timelineContainer, controlsContainer } = createWidgetContainer(el)
  let cosmograph: Cosmograph | undefined = undefined
  let pointTimeline: PointTimeline | undefined = undefined
  const legends = new CosmographLegends(graphContainer, model)

  model.on('msg:custom', async (msg: { [key: string]: never }) => {
    if (msg.type === 'select_point_by_index') {
      cosmograph?.selectPoint(msg.index, true)
    }
    if (msg.type === 'select_point_by_id') {
      const index = (await cosmograph?.getPointIndicesByIds([msg.id]))?.[0]
      cosmograph?.selectPoint(index, true)
    }
    if (msg.type === 'select_points_by_indices') {
      cosmograph?.selectPoints(msg.indices)
    }
    if (msg.type === 'select_points_by_ids') {
      const indices = await cosmograph?.getPointIndicesByIds(msg.ids)
      cosmograph?.selectPoints(indices ?? null)
    }
    if (msg.type === 'activate_rect_selection') {
      cosmograph?.activateRectSelection()
    }
    if (msg.type === 'deactivate_rect_selection') {
      cosmograph?.deactivateRectSelection()
    }
    if (msg.type === 'fit_view') {
      cosmograph?.fitView()
    }
    if (msg.type === 'fit_view_by_indices') {
      cosmograph?.fitViewByIndices(msg.indices, msg.duration, msg.padding)
    }
    if (msg.type === 'fit_view_by_ids') {
      const indices = await cosmograph?.getPointIndicesByIds(msg.ids)
      if (indices) cosmograph?.fitViewByIndices(indices, msg.duration, msg.padding)
    }
    if (msg.type === 'fit_view_by_coordinates') {
      cosmograph?.fitViewByCoordinates(msg.coordinates, msg.duration, msg.padding)
    }
    if (msg.type === 'focus_point_by_index') {
      cosmograph?.focusPoint(msg.index ?? undefined)
    }
    if (msg.type === 'focus_point') {
      const index = (await cosmograph?.getPointIndicesByIds([msg.id]))?.[0]
      cosmograph?.focusPoint(index)
    }
    if (msg.type === 'start') {
      cosmograph?.start(msg.alpha ?? undefined)
    }
    if (msg.type === 'pause') {
      cosmograph?.pause()
    }
    if (msg.type === 'restart') {
      cosmograph?.restart()
    }
    if (msg.type === 'step') {
      cosmograph?.step()
    }
  })

  const cosmographConfig: CosmographConfig = {
    pointLabelClassName: 'pointLabelClassName',
    onClick: async (index) => {
      if (index === undefined) {
        model.set('clicked_point_id', null)
      } else {
        const indices = await cosmograph?.getPointIdsByIndices([index])
        model.set('clicked_point_id', indices?.[0] ?? null)
      }
      model.set('clicked_point_index', index ?? null)
      model.save_changes()
    },
    onPointsFiltered: async () => {
      const indices = cosmograph?.getSelectedPointIndices()
      model.set('selected_point_indices', indices ?? [])
      model.set('selected_point_ids', indices ? await cosmograph?.getPointIdsByIndices(indices) : [])
      model.save_changes()
    },
  }

  const modelChangeHandlers: { [key: string]: () => void } = {
    _ipc_points: () => {
      const ipc = model.get('_ipc_points')
      cosmographConfig.points = ipc ? tableFromIPC(ipc.buffer) : undefined
    },
    _ipc_links: () => {
      const ipc = model.get('_ipc_links')
      cosmographConfig.links = ipc ? tableFromIPC(ipc.buffer) : undefined
    },

    disable_point_size_legend: async () => {
      await legends.updateLegend('point', 'size')
    },
    disable_link_width_legend: async () => {
      await legends.updateLegend('link', 'width')
    },
    disable_point_color_legend: async () => {
      await legends.updateLegend('point', 'color')
    },
    disable_link_color_legend: async () => {
      await legends.updateLegend('link', 'color')
    },
  }

  // Set config properties from model
  configProperties.forEach((prop) => {
    modelChangeHandlers[prop] = async () => {
      const value = model.get(prop)

      // "disable_simulation" -> "disableSimulation", "simulation_decay" -> "simulationDecay", etc.
      const snakeToCamelProp = toCamelCase(prop) as keyof CosmographConfig
      if (value === null) {
        delete cosmographConfig[snakeToCamelProp]
      } else {
        cosmographConfig[snakeToCamelProp] = value
      }
    }
  })

  function updatePointColorFn(pointsSummary?: Record<string, unknown>[]): 'range' | 'type' | undefined {
    const pointColorInfo = pointsSummary?.find(d => d.column_name === cosmographConfig.pointColorBy)
    if (pointColorInfo && duckDBNumericTypes.includes(pointColorInfo.column_type as string)) {
      const nodeColorScale = scaleSequential(interpolateWarm)
      nodeColorScale.domain([Number(pointColorInfo.min), Number(pointColorInfo.max)])
      cosmographConfig.pointColorByFn = (d: number) => nodeColorScale(d)
      return 'range'
    } else if (pointColorInfo && duckDBStringTypes.includes(pointColorInfo.column_type as string)) {
      if (color(pointColorInfo.min as string) && color(pointColorInfo.max as string)) {
        cosmographConfig.pointColorByFn = undefined
        return undefined
      }
      const uniqueValues = new Set<string>((cosmograph?.config?.points as Table)?.getChild(cosmographConfig.pointColorBy as string)?.toArray())
      const nodeColorScale = scaleSequential(interpolateWarm)
      cosmographConfig.pointColorByFn = (value: string): string => {
        const i = [...uniqueValues].indexOf(value)
        return nodeColorScale(i / (uniqueValues.size - 1))
      }
      return 'type'
    } else {
      cosmographConfig.pointColorByFn = undefined
      return undefined
    }
  }

  function updateLinkColorFn(linksSummary: Record<string, unknown>[]): void {
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

  const unsubscribes = Object
    .entries(modelChangeHandlers)
    .map(([propName, onModelChange]) => subscribe(model, `change:${propName}`, async () => {
      onModelChange()

      if (propName === 'point_size_by') {
        await legends.updateLegend('point', 'size')
      }
      if (propName === 'link_width_by') {
        await legends.updateLegend('link', 'width')
      }

      let pointColorType = undefined
      if (propName === 'point_color_by') {
        if (cosmograph) pointColorType = updatePointColorFn(cosmograph.stats.pointsSummary)
      }

      if (propName === 'link_color_by') {
        if (cosmograph?.stats.linksSummary) updateLinkColorFn(cosmograph.stats.linksSummary)
      }

      if (configProperties.includes(propName)) {
        cosmograph?.setConfig(cosmographConfig)
      }

      if (propName === 'point_color_by') {
        await legends.updateLegend('point', 'color', pointColorType)
      }

      if (propName === 'link_color_by') {
        await legends.updateLegend('link', 'color')
      }

      // `timeline_by` can be initialized once with first provided property
      // In order to update accessor need to re-prepare the data for cosmograph
      // or provide column name in `point_include_columns` array
      if (propName === 'timeline_by') {
        pointTimeline?.setConfig({ accessor: model.get('timeline_by') })
      }
    }))

  // Initializes the Cosmograph with the configured settings
  Object.values(modelChangeHandlers).forEach(callback => callback())

  await prepareCosmographDataAndMutate(cosmographConfig)

  cosmographConfig.onDataUpdated = async (stats) => {
    if (!cosmograph) return
    await legends.updateLegend('point', 'size')
    await legends.updateLegend('link', 'width')

    const pointColorType = updatePointColorFn(stats.pointsSummary)

    if (stats.linksSummary) {
      updateLinkColorFn(stats.linksSummary)
    }

    cosmograph.setConfig(cosmographConfig)
    await legends.updateLegend('point', 'color', pointColorType)
    await legends.updateLegend('link', 'color')

    pointTimeline?.setConfig({ accessor: model.get('timeline_by') })
  }

  cosmograph = new Cosmograph(graphContainer, cosmographConfig)
  legends.setCosmograph(cosmograph)
  pointTimeline = new PointTimeline(cosmograph, timelineContainer, {
    accessor: model.get('timeline_by'),
  })

  new ControlButtonsComponent(cosmograph, controlsContainer)

  return (): void => {
    unsubscribes.forEach(unsubscribe => unsubscribe())
    cosmograph?.destroy()
  }
}

export default { render }
