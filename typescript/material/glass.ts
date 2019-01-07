import {
  Color3,
  Scene,
  StandardMaterial,
} from 'babylonjs'

import Abstract from './abstract'


export default class Glass extends Abstract {

  build(scene: Scene): void {
    let material = new StandardMaterial(this.name, scene)
    material.diffuseColor = Color3.FromHexString(this.color)
    material.alpha = 0.3
  }
}
