import {
  Engine,
  Scene,
  HemisphericLight,
  Vector3,
  FreeCamera,
} from 'babylonjs'

import { Builder } from './builder'


export enum Color {
  Background = '#f0f1eb',
  Glass = '#007deb',
  Metal = '#b2cc99',
}


export class App {
  private canvas: HTMLCanvasElement
  private engine: Engine
  private scene: Scene
  private bootstraps: Array<Builder> = []

  constructor(element: HTMLCanvasElement) {
    this.canvas = element
    this.engine = new Engine(element, true)
    this.engine.setHardwareScalingLevel(0.5)
  }

  registerBuilder(builder: Builder): App {
    this.bootstraps.push(builder)

    return this
  }

  setupScene(): App {
    let canvas = this.canvas
    let scene = this.scene = new Scene(this.engine)

    let camera = new FreeCamera('camera', new Vector3(0, 0.5, -1), scene)
    camera.minZ = .1
    camera.speed = 0.1
    camera.setTarget(Vector3.Zero())
    camera.attachControl(canvas, false)

    new HemisphericLight('light', new Vector3(0, 1, 0), scene)

    this.bootstraps.forEach(bootstrap => bootstrap.build(scene))

    return this
  }

  doRender(): App {
    this.engine.runRenderLoop(() => {
      this.scene.render()
    })

    window.addEventListener('resize', () => {
      this.engine.resize()
    })

    return this
  }

}
