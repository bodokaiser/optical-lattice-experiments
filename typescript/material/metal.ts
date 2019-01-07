import {
  Color3,
  Scene,
  PBRMetallicRoughnessMaterial,
} from 'babylonjs'

import Abstract from './abstract'


export default class Metal extends Abstract {

  build(scene: Scene): void {
    let material = new PBRMetallicRoughnessMaterial(this.name, scene)
    material.baseColor = Color3.FromHexString(this.color)
    material.metallic = 1.0
    material.roughness = 0.6
  }

}
