import {
  MeshBuilder,
  Scene,
} from 'babylonjs'

import Abstract from './abstract'


export default class Ground extends Abstract {

  build(scene: Scene): void {
    let ground = MeshBuilder.CreateGround(this.name,
      { width: 1, height: 1 }, scene)
    ground.material = scene.getMaterialByID(this.material)
  }

}
