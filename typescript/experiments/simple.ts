import {
  Animation,
  Mesh,
  Color3,
  Vector3,
  MeshBuilder,
  PBRMetallicRoughnessMaterial,
} from 'babylonjs'

import { Setup } from '../setup'
import { Color } from '../theme'

class SimpleSetup extends Setup {

  setupScene() : Setup {
    super.setupScene()

    let pbr = new PBRMetallicRoughnessMaterial('pbr', this._scene)
    pbr.metallic = 1.0
    pbr.roughness = 1.0

    let glass = new BABYLON.StandardMaterial("glass", this._scene);
    glass.diffuseColor = Color3.FromHexString(Color.Primary)
    glass.specularPower = 150
    glass.emissiveColor = new Color3(0.15, 0.15, 0.15)
    glass.alpha = 0.3

    let cylinder = MeshBuilder.CreateCylinder('cylinder',
      { height: 0.1, diameter: 0.05 }, this._scene)
    cylinder.material = pbr
    cylinder.rotation.z = Math.PI / 2
    cylinder.position.x = -0.45
    cylinder.position.y = 0.05

    let plane1 = MeshBuilder.CreatePlane('plane1',
      { width: 0.1, height: 0.2, sideOrientation: Mesh.DOUBLESIDE },
      this._scene)
    plane1.material = glass
    plane1.rotation.y = Math.PI / 2
    plane1.position.x = 0.5

    let plane2 = plane1.clone()
    plane2.position.x = -0.3

    let animation1 = new Animation('animation1', 'position.x',
      2, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE)
    animation1.setKeys([
      { frame: 0, value: plane2.position.x },
      { frame: 10, value: 0.5 }
    ])

    let disc = MeshBuilder.CreateDisc('disc',
      { radius: 0.02, sideOrientation: Mesh.DOUBLESIDE }, this._scene)
    disc.rotation.y = Math.PI / 2
    disc.position.x = -0.4
    disc.position.y = 0.05
    disc.animations.push(animation1)

    this._scene.beginAnimation(disc, 0, 10, true)

    return this
  }
}

window.addEventListener('load', () => {
  let canvas = document.getElementById('canvas') as HTMLCanvasElement

  new SimpleSetup(canvas)
    .setupScene()
    .doRender()
})

if (module.hot) {
  module.hot.accept(() => {
    location.reload()
  })
}
