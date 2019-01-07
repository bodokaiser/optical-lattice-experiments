import { Scene } from 'babylonjs'

import { Builder } from '../builder'


export default abstract class Geometry implements Builder {

  protected name: string
  protected material: string

  constructor(name: string, material: string) {
    this.name = name
    this.material = material
  }

  abstract build(scene: Scene): void

}
