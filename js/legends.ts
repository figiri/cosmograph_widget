import { AnyModel } from '@anywidget/types'
import {
  Cosmograph,
  CosmographSizeLegend,
  CosmographRangeColorLegend,
  CosmographTypeColorLegend,
} from '@cosmograph/cosmograph'

import { createWidgetLegendElements } from './widget-elements'

export class CosmographLegends {
  public pointSizeLegendContainer: HTMLDivElement
  public linkWidthLegendContainer: HTMLDivElement
  public pointColorLegendContainer: HTMLDivElement
  public pointTypeColorLegendContainer: HTMLDivElement
  public linkColorLegendContainer: HTMLDivElement
  public model: AnyModel
  public cosmograph: Cosmograph | undefined

  private _pointSizeLegend: CosmographSizeLegend | undefined
  private _linkWidthLegend: CosmographSizeLegend | undefined
  private _pointRangeColorLegend: CosmographRangeColorLegend | undefined
  private _pointTypeColorLegend: CosmographTypeColorLegend | undefined
  private _linkRangeColorLegend: CosmographRangeColorLegend | undefined

  constructor(container: HTMLElement, model: AnyModel) {
    const { pointSizeLegendContainer, linkWidthLegendContainer, pointColorLegendContainer, pointTypeColorLegendContainer, linkColorLegendContainer } = createWidgetLegendElements(container)
    this.pointSizeLegendContainer = pointSizeLegendContainer
    this.linkWidthLegendContainer = linkWidthLegendContainer
    this.pointColorLegendContainer = pointColorLegendContainer
    this.pointTypeColorLegendContainer = pointTypeColorLegendContainer
    this.linkColorLegendContainer = linkColorLegendContainer

    this.model = model
  }

  public setCosmograph(cosmograph: Cosmograph): void {
    this.cosmograph = cosmograph
  }

  public async updateLegend(
    type: 'point' | 'link',
    property: 'size' | 'color' | 'width',
    colorType?: 'range' | 'type'
  ): Promise<void> {
    if (!this.cosmograph) return
    const disable = this.model.get(`disable_${type}_${property}_legend`) as (boolean | null)
    const by = this.model.get(`${type}_${property}_by`) as (string | null)
    let show = disable !== true && typeof by === 'string'

    const { container, legendInstance } = await this._getLegendContainerAndInstance(type, property, show, colorType)
    if (`${type}_${property}` === 'point_color' && (colorType === 'range' || colorType === undefined) && this._pointTypeColorLegend) {
      this._updateLegendVisibility(this.pointTypeColorLegendContainer, this._pointTypeColorLegend, false)
    }
    if (`${type}_${property}` === 'point_color' && (colorType === 'type' || colorType === undefined) && this._pointRangeColorLegend) {
      this._updateLegendVisibility(this.pointColorLegendContainer, this._pointRangeColorLegend, false)
    }
    if (!container || !legendInstance) return
    if (`${type}_${property}` === 'link_color' && this.cosmograph.config.linkColorByFn === undefined) {
      show = false
    }
    this._updateLegendVisibility(container, legendInstance, show)
  }

  private async _getLegendContainerAndInstance(
    type: 'point' | 'link',
    property: 'size' | 'color' | 'width',
    show: boolean,
    colorType?: 'range' | 'type'
  ): Promise<{ container: HTMLDivElement | undefined; legendInstance: CosmographSizeLegend | CosmographRangeColorLegend | CosmographTypeColorLegend | undefined }> {
    if (!this.cosmograph) return { container: undefined, legendInstance: undefined }
    await this.cosmograph.graphReady()
    let container: HTMLDivElement | undefined
    let legendInstance: CosmographSizeLegend | CosmographRangeColorLegend | CosmographTypeColorLegend | undefined

    switch (`${type}_${property}`) {
      case 'point_size':
        container = this.pointSizeLegendContainer
        if (!this._pointSizeLegend && show) {
          this._pointSizeLegend = new CosmographSizeLegend(this.cosmograph, container)
        }
        if (this._pointSizeLegend) {
          await this._pointSizeLegend.setConfig({
            ...(await this._pointSizeLegend.getConfig()),
            label: d => `${type}s by ${d}`,
          })
        }
        legendInstance = this._pointSizeLegend
        break
      case 'point_color':
        if (colorType === 'range') {
          container = this.pointColorLegendContainer
          if (!this._pointRangeColorLegend && show) {
            this._pointRangeColorLegend = new CosmographRangeColorLegend(this.cosmograph, container)
          }
          if (this._pointRangeColorLegend) {
            await this._pointRangeColorLegend.setConfig({
              ...(await this._pointRangeColorLegend.getConfig()),
              label: d => `${type}s by ${d}`,
            })
          }
          legendInstance = this._pointRangeColorLegend
        } else if (colorType === 'type') {
          container = this.pointTypeColorLegendContainer
          if (!this._pointTypeColorLegend && show) {
            this._pointTypeColorLegend = new CosmographTypeColorLegend(this.cosmograph, container)
          }
          legendInstance = this._pointTypeColorLegend
        }
        break
      case 'link_width':
        container = this.linkWidthLegendContainer
        if (!this._linkWidthLegend && show) {
          this._linkWidthLegend = new CosmographSizeLegend(this.cosmograph, container, {
            useLinksData: true,
            label: d => `${type}s by ${d}`,
          })
        }
        legendInstance = this._linkWidthLegend
        break
      case 'link_color':
        container = this.linkColorLegendContainer
        if (!this._linkRangeColorLegend && show) {
          this._linkRangeColorLegend = new CosmographRangeColorLegend(this.cosmograph, container)
        }
        if (this._linkRangeColorLegend) {
          await this._linkRangeColorLegend.setConfig({
            ...(await this._linkRangeColorLegend.getConfig()),
            useLinksData: true,
            label: d => `${type}s by ${d}`,
          })
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
    legend: CosmographSizeLegend | CosmographRangeColorLegend | CosmographTypeColorLegend,
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
