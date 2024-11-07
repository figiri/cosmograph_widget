import type { RenderProps } from "@anywidget/types"
import { Cosmograph, CosmographConfig, prepareCosmographDataArrow, CosmographSizeLegend } from '@cosmograph/cosmograph'
import { tableFromIPC } from 'apache-arrow'

import { subscribe, toCamelCase } from './helper'
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

	let pointSizeLegend: CosmographSizeLegend | undefined = undefined
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
		'change:_ipc_points': () => {
			const ipc = model.get('_ipc_points')
			cosmographConfig.points = ipc ? tableFromIPC(ipc.buffer) : undefined
		},
		'change:_ipc_links': () => {
			const ipc = model.get('_ipc_links')
			cosmographConfig.links = ipc ? tableFromIPC(ipc.buffer) : undefined
		},

		'change:disable_point_size_legend': () => {
			const disablePointSizeLegend = model.get('disable_point_size_legend')

			// TODO: This is a temporary workaround for a bug in Cosmograph where calling `pointSizeLegend.hide()` does not function correctly immediately after initialization.
			if (!pointSizeLegend && !disablePointSizeLegend && cosmograph) {
				pointSizeLegend = new CosmographSizeLegend(cosmograph, bottomContainer)
			}

			if (disablePointSizeLegend) {
				pointSizeLegend?.hide()
			} else {
				pointSizeLegend?.show()
			}
		}
	}

	// Set config properties from model
	configProperties.forEach(prop => {
		modelChangeHandlers[`change:${prop}`] = () => {
			const value = model.get(prop)

			// "disable_simulation" -> "disableSimulation", "simulation_decay" -> "simulationDecay", etc.
			if (value !== null) cosmographConfig[toCamelCase(prop) as keyof CosmographConfig] = value

			cosmograph?.setConfig(cosmographConfig)

			// TODO: This is a temporary fix for an issue in the Cosmograph Size Legend where adjusting the pointSize does not update the size legend properly.
			if (prop === 'point_size' && pointSizeLegend) {
				const pointSizeLegendConfig = pointSizeLegend.getConfig()
				pointSizeLegend.setConfig(pointSizeLegendConfig)
				if (!model.get('disable_point_size_legend')) pointSizeLegend.show()
			}
		}
	})

	const unsubscribes = Object
		.entries(modelChangeHandlers)
		.map(([name, onModelChange]) => subscribe(model, name, () => {
			onModelChange()
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

	cosmograph = new Cosmograph(graphContainer, cosmographConfig)

	// Point Size Legend
	// TODO: Add a custom label for the size legend
	// TODO: Set up the Point Size Legend at this point, once the issue with `pointSizeLegend.hide()` being called immediately after initialization is resolved in the Cosmograph.
	// pointSizeLegend = new CosmographSizeLegend(cosmograph, bottomContainer)
	// if (model.get('disable_point_size_legend')) pointSizeLegend.hide()

	// TODO: This is a temporary workaround for a bug in Cosmograph where calling `pointSizeLegend.hide()` does not function correctly immediately after initialization.
	if (!pointSizeLegend && !model.get('disable_point_size_legend')) {
		pointSizeLegend = new CosmographSizeLegend(cosmograph, bottomContainer)
	}

	// Link Width Legend
	// TODO: Add linkWidthLegend 👇. The `useLinksData: true` parameter does not work in the current cosmograph beta version.
	// const linkWidthLegend = new CosmographSizeLegend(cosmograph, bottomContainer, {
	// 	useLinksData: true
	// })

 return () => {
		unsubscribes.forEach(unsubscribe => unsubscribe())
	};
}

export default { render }
