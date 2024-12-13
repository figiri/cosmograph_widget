export function createWidgetContainer(el: HTMLElement): Record<string, HTMLDivElement> {
  el.classList.add('wrapper')
  const graphContainer = document.createElement('div')
  graphContainer.classList.add('graph')
  el.appendChild(graphContainer)

  return {
    graphContainer,
  }
}

export function createWidgetLegendElements(el: HTMLElement): Record<string, HTMLDivElement> {
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

  const pointTypeColorLegendContainer = document.createElement('div')
  pointTypeColorLegendContainer.classList.add('pointTypeColorLegend')
  bottomContainer.appendChild(pointTypeColorLegendContainer)

  const linkColorLegendContainer = document.createElement('div')
  linkColorLegendContainer.classList.add('linkColorLegend')
  bottomContainer.appendChild(linkColorLegendContainer)

  return {
    pointSizeLegendContainer,
    linkWidthLegendContainer,
    pointColorLegendContainer,
    pointTypeColorLegendContainer,
    linkColorLegendContainer,
  }
}
