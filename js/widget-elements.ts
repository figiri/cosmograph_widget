export function createWidgetElements (el) {
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

  return {
    graphContainer,
    pointSizeLegendContainer,
    linkWidthLegendContainer,
    pointColorLegendContainer,
    linkColorLegendContainer
  }
}

export function updateLegendVisibility (container, legend, disable) {
  if (disable) {
    container.classList.add('disable')
    legend?.hide?.()
  } else {
    container.classList.remove('disable')
    legend?.show?.()
  }
}