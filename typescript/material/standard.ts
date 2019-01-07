import {
  Color3,
  Scene,
  StandardMaterial,
} from 'babylonjs'

import Abstract from './abstract'


export default class Standard extends Abstract {

  private alpha: number

  constructor(name: string, color: string, alpha: number = 1.0) {
    super(name, color)

    this.alpha = alpha
  }

  build(scene: Scene): void {
    let material = new StandardMaterial(this.name, scene)
    material.diffuseColor = Color3.FromHexString(this.color)
    material.alpha = this.alpha
  }
}
