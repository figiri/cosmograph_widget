import type { RenderProps } from "@anywidget/types"
import { Cosmograph, CosmographConfig, prepareCosmographDataArrow } from '@cosmograph/cosmograph'
import { tableFromIPC } from 'apache-arrow'

import { subscribe, toCamelCase } from './helper'
import { configProperties } from './config-props'

import "./widget.css"

async function render({ model, el }: RenderProps) {
	el.classList.add("cosmograph_widget")
	const main = document.createElement('div')
  main.classList.add('widget-container')
	el.appendChild(main)

	const cosmographContainer = document.createElement('div')
  cosmographContainer.classList.add('cosmograph-container')
  main.appendChild(cosmographContainer)

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
		}
	}

	// Set config properties from model
	configProperties.forEach(prop => {
		modelChangeHandlers[`change:${prop}`] = () => {
			const value = model.get(prop)

			// "disable_simulation" -> "disableSimulation", "simulation_decay" -> "simulationDecay", etc.
			if (value !== null) cosmographConfig[toCamelCase(prop) as keyof CosmographConfig] = value
		}
	})

	const unsubscribes = Object
		.entries(modelChangeHandlers)
		.map(([name, onModelChange]) => subscribe(model, name, () => {
			onModelChange()
			cosmograph.setConfig(cosmographConfig)
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

	const cosmograph = new Cosmograph(cosmographContainer, cosmographConfig)

 return () => {
		unsubscribes.forEach(unsubscribe => unsubscribe())
	};
}

export default { render }
