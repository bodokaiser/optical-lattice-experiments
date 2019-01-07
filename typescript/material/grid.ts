import {
  Color3,
  Scene,
} from 'babylonjs'
import {
  GridMaterial
} from 'babylonjs-materials'


import Abstract from './abstract'

export default class Grid extends Abstract {

  build(scene: Scene): void {
    let material = new GridMaterial(this.name, scene)
    material.gridRatio = 0.1
    material.mainColor = Color3.FromHexString(this.color)
    material.lineColor = Color3.Black()
  }

}
