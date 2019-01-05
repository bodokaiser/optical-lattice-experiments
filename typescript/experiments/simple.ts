import {
  Mesh,
  Color3,
  Vector3,
  MeshBuilder,
  PBRMetallicRoughnessMaterial
} from 'babylonjs'

import { Setup } from '../setup'

class SimpleSetup extends Setup {

  setupScene() : Setup {
    super.setupScene()

    let pbr = new PBRMetallicRoughnessMaterial('pbr', this._scene)
    pbr.metallic = 1.0
    pbr.roughness = 1.0

    let glass = new BABYLON.StandardMaterial("glass", this._scene);
    glass.diffuseColor = new Color3(0, 0, 0)
    glass.specularPower = 150
    glass.emissiveColor = new Color3(0.15, 0.15, 0.15)
    glass.alpha = 0.5

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
    plane1.position.x = -0.3

    let disc = MeshBuilder.CreateDisc('disc', {}, this._scene)

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
