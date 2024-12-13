import { AnyModel } from '@anywidget/types'
import { Cosmograph, CosmographSizeLegend, CosmographRangeColorLegend, CosmographSizeLegendConfig, CosmographRangeColorLegendConfig } from '@cosmograph/cosmograph'

import { createWidgetLegendElements } from './widget-elements'

export class CosmographLegends {
  public pointSizeLegendContainer: HTMLDivElement
  public linkWidthLegendContainer: HTMLDivElement
  public pointColorLegendContainer: HTMLDivElement
  public linkColorLegendContainer: HTMLDivElement
  public model: AnyModel
  public cosmograph: Cosmograph | undefined

  private _pointSizeLegend: CosmographSizeLegend | undefined
  private _linkWidthLegend: CosmographSizeLegend | undefined
  private _pointRangeColorLegend: CosmographRangeColorLegend | undefined
  private _linkRangeColorLegend: CosmographRangeColorLegend | undefined

  constructor(container: HTMLElement, model: AnyModel) {
    const { pointSizeLegendContainer, linkWidthLegendContainer, pointColorLegendContainer, linkColorLegendContainer } = createWidgetLegendElements(container)
    this.pointSizeLegendContainer = pointSizeLegendContainer
    this.linkWidthLegendContainer = linkWidthLegendContainer
    this.pointColorLegendContainer = pointColorLegendContainer
    this.linkColorLegendContainer = linkColorLegendContainer

    this.model = model
  }

  public setCosmograph(cosmograph: Cosmograph): void {
    this.cosmograph = cosmograph
  }

  public async updateLegend(
    type: 'point' | 'link',
    property: 'size' | 'color' | 'width'
  ): Promise<void> {
    if (!this.cosmograph) return
    const disable = this.model.get(`disable_${type}_${property}_legend`) as (boolean | null)
    const by = this.model.get(`${type}_${property}_by`) as (string | null)
    const show = disable !== true && typeof by === 'string'

    const { container, legendInstance } = await this._getLegendContainerAndInstance(type, property, show)
    if (!container || !legendInstance) return

    this._updateLegendVisibility(container, legendInstance, show)

    if (show) {
      const config = legendInstance.getConfig() as CosmographSizeLegendConfig & CosmographRangeColorLegendConfig
      config.label = d => `${type}s by ${d}`
      await legendInstance.setConfig(config)
    }
  }

  private async _getLegendContainerAndInstance(
    type: 'point' | 'link',
    property: 'size' | 'color' | 'width',
    show: boolean
  ): Promise<{ container: HTMLDivElement | undefined; legendInstance: CosmographSizeLegend | CosmographRangeColorLegend | undefined }> {
    if (!this.cosmograph) return { container: undefined, legendInstance: undefined }
    let container: HTMLDivElement | undefined
    let legendInstance: CosmographSizeLegend | CosmographRangeColorLegend | undefined

    switch (`${type}_${property}`) {
      case 'point_size':
        container = this.pointSizeLegendContainer
        if (!this._pointSizeLegend && show) {
          this._pointSizeLegend = new CosmographSizeLegend(this.cosmograph, container)
        }
        legendInstance = this._pointSizeLegend
        break
      case 'point_color':
        container = this.pointColorLegendContainer
        if (!this._pointRangeColorLegend && show) {
          this._pointRangeColorLegend = new CosmographRangeColorLegend(this.cosmograph, container)
        }
        legendInstance = this._pointRangeColorLegend
        break
      case 'link_width':
        container = this.linkWidthLegendContainer
        if (!this._linkWidthLegend && show) {
          this._linkWidthLegend = new CosmographSizeLegend(this.cosmograph, container)
          await this._linkWidthLegend.setConfig({ useLinksData: true })
        }
        legendInstance = this._linkWidthLegend
        break
      case 'link_color':
        container = this.linkColorLegendContainer
        if (!this._linkRangeColorLegend && show) {
          this._linkRangeColorLegend = new CosmographRangeColorLegend(this.cosmograph, container)
          await this._linkRangeColorLegend.setConfig({ useLinksData: true })
        }
        legendInstance = this._linkRangeColorLegend
        break
      default:
        return { container: undefined, legendInstance: undefined }
    }

    return { container, legendInstance }
  }

  private _updateLegendVisibility(
    container: HTMLDivElement,
    legend: CosmographSizeLegend | CosmographRangeColorLegend,
    show: boolean
  ): void {
    if (show) {
      container.classList.remove('disable')
      legend.show()
    } else {
      container.classList.add('disable')
      legend.hide()
    }
  }
}
