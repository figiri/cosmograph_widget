import type { RenderProps } from "@anywidget/types"
import { Cosmograph, CosmographConfig, prepareCosmographDataArrow, CosmographSizeLegend, CosmographRangeColorLegend } from '@cosmograph/cosmograph'
import { tableFromIPC } from 'apache-arrow'
import { scaleSequential } from 'd3-scale'
import { interpolateWarm } from 'd3-scale-chromatic'

import { subscribe, toCamelCase, duckDBNumericTypes } from './helper'
import { configProperties } from './config-props'

import "./widget.css"

async function render({ model, el }: RenderProps) {
	el.classList.add('wrapper')
	const graphContainer = document.createElement('div')
  graphContainer.classList.add('graph')
	el.appendChild(graphContainer)

	const bottomContainer = document.createElement('div')
	bottomContainer.classList.add('bottom')
	el.appendChild(bottomContainer)

	const pointSizeLegendContainer = document.createElement('div')
	pointSizeLegendContainer.classList.add('pointSizeLegend')
	bottomContainer.appendChild(pointSizeLegendContainer)

	const linkWidthLegendContainer = document.createElement('div')
	linkWidthLegendContainer.classList.add('linkWidthLegend')	
	bottomContainer.appendChild(linkWidthLegendContainer)

	const pointColorLegendContainer = document.createElement('div')
	pointColorLegendContainer.classList.add('pointColorLegend')
	bottomContainer.appendChild(pointColorLegendContainer)

	const linkColorLegendContainer = document.createElement('div')
	linkColorLegendContainer.classList.add('linkColorLegend')
	bottomContainer.appendChild(linkColorLegendContainer)

	let pointSizeLegend: CosmographSizeLegend | undefined = undefined
	let linkWidthLegend: CosmographSizeLegend | undefined = undefined
	let pointRangeColorLegend: CosmographRangeColorLegend | undefined = undefined
	let linkRangeColorLegend: CosmographRangeColorLegend | undefined = undefined
	let cosmograph: Cosmograph | undefined = undefined

	model.on('msg:custom', (msg: { [key: string]: never }) => {
		if (msg.type === 'select_point_by_index') {
			cosmograph?.selectPoint(msg.index, true)
		}
		if (msg.type === 'select_points_by_indices') {
			cosmograph?.selectPoints(msg.indices)
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
		if (msg.type === 'fit_view_by_coordinates') {
			cosmograph?.fitViewByCoordinates(msg.coordinates, msg.duration, msg.padding)
		}
		if(msg.type === 'focus_point') {
			cosmograph?.focusPoint(msg.index ?? undefined)
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
	});

	const cosmographConfig: CosmographConfig = {
		onClick: (index) => {
			model.set('clicked_point_index', index)
			model.save_changes()
		},
		onPointsFiltered: () => {
			model.set('selected_point_indices', cosmograph?.getSelectedPointIndices() ?? [])
			model.save_changes()
		}
	}

	const modelChangeHandlers: { [key: string]: () => void } = {
		'_ipc_points': () => {
			const ipc = model.get('_ipc_points')
			cosmographConfig.points = ipc ? tableFromIPC(ipc.buffer) : undefined
		},
		'_ipc_links': () => {
			const ipc = model.get('_ipc_links')
			cosmographConfig.links = ipc ? tableFromIPC(ipc.buffer) : undefined
		},

		'disable_point_size_legend': () => {
			const disablePointSizeLegend = model.get('disable_point_size_legend')
			// TODO: This is a temporary workaround for a bug in Cosmograph where calling `pointSizeLegend.hide()` does not function correctly immediately after initialization.
			if (!pointSizeLegend && !disablePointSizeLegend && cosmograph) {
				pointSizeLegend = new CosmographSizeLegend(cosmograph, pointSizeLegendContainer, {
					label: (d) => `points by ${d}`,
				})
			}

			if (disablePointSizeLegend) {
				pointSizeLegendContainer.classList.add('disable')
				pointSizeLegend?.hide()
			} else {
				pointSizeLegendContainer.classList.remove('disable')
				pointSizeLegend?.show()
			}
		},
		'disable_link_width_legend': () => {
			const disableLinkWidthLegend = model.get('disable_link_width_legend')
			// TODO: This is a temporary workaround for a bug in Cosmograph where calling `linkWidthLegend.hide()` does not function correctly immediately after initialization.
			if (!linkWidthLegend && !disableLinkWidthLegend && cosmograph)
			linkWidthLegend = new CosmographSizeLegend(cosmograph, linkWidthLegendContainer, {
				label: (d) => `links by ${d}`,
				useLinksData: true
			})

			if (disableLinkWidthLegend) {
				linkWidthLegendContainer.classList.add('disable')
				linkWidthLegend?.hide()
			} else {
				linkWidthLegendContainer.classList.remove('disable')
				linkWidthLegend?.show()
			}
		},
		'disable_point_range_color_legend': () => {
			// TODO: Add with new cosmograph version. Does not work yet
			const disablePointRangeColorLegend = model.get('disable_point_range_color_legend')
			if (disablePointRangeColorLegend) {
				pointColorLegendContainer.classList.add('disable')
				// pointRangeColorLegend?.hide()
			} else {
				pointColorLegendContainer.classList.remove('disable')
				// pointRangeColorLegend?.show()
			}
		},
		'disable_link_range_color_legend': () => {
			// TODO: 👆
			const disableLinkRangeColorLegend = model.get('disable_link_range_color_legend')
			if (disableLinkRangeColorLegend) {
				linkColorLegendContainer.classList.add('disable')
				// linkRangeColorLegend?.hide()
			} else {
				linkColorLegendContainer.classList.remove('disable')
				// linkRangeColorLegend?.show()
			}
		}
	}

	// Set config properties from model
	configProperties.forEach(prop => {
		modelChangeHandlers[prop] = async () => {
			const value = model.get(prop)

			// "disable_simulation" -> "disableSimulation", "simulation_decay" -> "simulationDecay", etc.
			if (value !== null) cosmographConfig[toCamelCase(prop) as keyof CosmographConfig] = value

			// TODO: This is a temporary fix for an issue in the Cosmograph Size Legend where adjusting the pointSize does not update the size legend properly.
			if (prop === 'point_size' && pointSizeLegend) {
				const pointSizeLegendConfig = pointSizeLegend.getConfig()
				pointSizeLegendConfig.label = (d) => `points by ${d}`
				pointSizeLegend.setConfig(pointSizeLegendConfig)
			}
			if (prop === 'link_width' && linkWidthLegend) {
				const linkWidthLegendConfig = linkWidthLegend.getConfig()
				linkWidthLegendConfig.label = (d) => `links by ${d}`
				linkWidthLegend.setConfig(linkWidthLegendConfig)
			}
		}
	})

	function updatePointColorFn (pointsSummary: Record<string, unknown>[]): void {
		const pointColorInfo = pointsSummary.find(d => d.column_name === cosmographConfig.pointColor)
		if (duckDBNumericTypes.includes(pointColorInfo?.column_type)) {
			const nodeColorScale = scaleSequential(interpolateWarm)
			nodeColorScale.domain([Number(pointColorInfo.min), Number(pointColorInfo.max)])
			cosmographConfig.pointColorFn = (d: number) => nodeColorScale(d)
		} else {
			cosmographConfig.pointColorFn = undefined
		}
		// TODO: If the data is of category type, use `CosmographTypeColorLegend`
	}

	function updateLinkColorFn (linksSummary: Record<string, unknown>[]) {
		const linkColorInfo = linksSummary.find(d => d.column_name === cosmographConfig.linkColor)
		if (duckDBNumericTypes.includes(linkColorInfo?.column_type)) {
			const linkColorScale = scaleSequential(interpolateWarm)
			linkColorScale.domain([Number(linkColorInfo.min), Number(linkColorInfo.max)])
			cosmographConfig.linkColorFn = (d: number) => linkColorScale(d)
		} else {
			cosmographConfig.linkColorFn = undefined
		}
		// TODO: If the data is of category type, use `CosmographTypeColorLegend`
	}

	const unsubscribes = Object
		.entries(modelChangeHandlers)
		.map(([propName, onModelChange]) => subscribe(model, `change:${propName}`, () => {
			onModelChange()

			if (propName === 'point_color' && pointRangeColorLegend && cosmograph) {
				updatePointColorFn(cosmograph.stats?.pointsSummary)

				// Temporary workaround
				const pointRangeColorLegendConfig = pointRangeColorLegend.getConfig()
				pointRangeColorLegend.setConfig(pointRangeColorLegendConfig)
			}

			if (propName === 'link_color' && linkRangeColorLegend && cosmograph) {
				updateLinkColorFn(cosmograph.stats?.linksSummary)

				// Temporary workaround
				const linkRangeColorLegendConfig = linkRangeColorLegend.getConfig()
				linkRangeColorLegend.setConfig(linkRangeColorLegendConfig)
			}

			if (configProperties.includes(propName)) {
				cosmograph?.setConfig(cosmographConfig)
			}
		}))

	// Initializes the Cosmograph with the configured settings
  Object.values(modelChangeHandlers).forEach(callback => callback())

	/**
  * Prepares the Cosmograph data configuration when the points are `undefined` but the links are defined.
  * This method will fetch the necessary data for the points based on the link source and target information.
  * The resulting configuration is then merged into the existing `cosmographConfig` object.
  */
 if (cosmographConfig.points === undefined && cosmographConfig.links !== undefined
		&& cosmographConfig.linkTarget !== undefined && cosmographConfig.linkSource !== undefined) {
		const preparedDataArrow = await prepareCosmographDataArrow({
			points: {
				linkSource: cosmographConfig.linkSource,
				linkTargets: [cosmographConfig.linkTarget],
			},
			links: {
				linkSource: cosmographConfig.linkSource,
				linkTargets: [cosmographConfig.linkTarget],
			},
		}, cosmographConfig.links, cosmographConfig.links)

		Object.assign(cosmographConfig, preparedDataArrow?.cosmographConfig, {
			points: preparedDataArrow?.points,
			links: preparedDataArrow?.links
		})
	}

	cosmographConfig.onDataUpdated = stats => {
		// Point Size Legend
		const disablePointSizeLegend = model.get('disable_point_size_legend')
		if (!disablePointSizeLegend) {
			pointSizeLegend = new CosmographSizeLegend(cosmograph, pointSizeLegendContainer, {
				label: (d) => `points by ${d}`,
			})
		}
		// if (disablePointSizeLegend) pointSizeLegend.hide()

		// Link Width Legend
		const disableLinkWidthLegend = model.get('disable_link_width_legend')
		if (!disableLinkWidthLegend) {
			linkWidthLegend = new CosmographSizeLegend(cosmograph, linkWidthLegendContainer, {
				label: (d) => `links by ${d}`,
				useLinksData: true
			})
		}
		// if (disableLinkWidthLegend) linkWidthLegend.hide()

		// Point Color Range Legend
		updatePointColorFn(stats.pointsSummary)
		cosmograph.setConfig(cosmographConfig)
		pointRangeColorLegend = new CosmographRangeColorLegend(cosmograph, pointColorLegendContainer, {
			label: (d) => `points by ${d}`,
		})

		// Link Color Range Legend
		updateLinkColorFn(stats.linksSummary)
		cosmograph.setConfig(cosmographConfig)
		linkRangeColorLegend = new CosmographRangeColorLegend(cosmograph, linkColorLegendContainer, {
			label: (d) => `links by ${d}`,
			useLinksData: true
		})
	}

	cosmograph = new Cosmograph(graphContainer, cosmographConfig)

 return () => {
		unsubscribes.forEach(unsubscribe => unsubscribe())
	};
}

export default { render }
