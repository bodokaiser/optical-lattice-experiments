import {
  Animation,
  Mesh,
  Color3,
  Color4,
  Vector3,
  VertexBuffer,
  MeshBuilder,
  PBRMetallicRoughnessMaterial,
  SolidParticleSystem,
  SolidParticle,
} from 'babylonjs'

import { Setup } from '../setup'
import { Color } from '../theme'
import { uniform } from '../random'
import { GaussianBeam } from '../physic'

class SimpleSetup extends Setup {

  setupScene() : Setup {
    super.setupScene()

    let scene = super.Scene()
    let engine = super.Engine()

    let pbr = new PBRMetallicRoughnessMaterial('pbr', scene)
    pbr.metallic = 1.0
    pbr.roughness = 1.0

    let glass = new BABYLON.StandardMaterial("glass", scene);
    glass.diffuseColor = Color3.FromHexString(Color.Primary)
    glass.specularPower = 150
    glass.emissiveColor = new Color3(0.15, 0.15, 0.15)
    glass.alpha = 0.3

    let cylinder = MeshBuilder.CreateCylinder('cylinder',
      { height: 0.1, diameter: 0.05 }, scene)
    cylinder.material = pbr
    cylinder.rotation.z = Math.PI / 2
    cylinder.position.x = -0.45
    cylinder.position.y = 0.05

    let plane1 = MeshBuilder.CreatePlane('plane1',
      { width: 0.1, height: 0.1, sideOrientation: Mesh.DOUBLESIDE }, scene)
    plane1.material = glass
    plane1.rotation.y = Math.PI / 2
    plane1.position.x = 0.5
    plane1.position.y = 0.05

    let plane2 = plane1.clone()
    plane2.position.x = -0.3

    let gaussian = new GaussianBeam(1e-2, 1000e-9)

    let disc = MeshBuilder.CreateDisc('disc', { radius: 1e-3 }, scene)

    let sps = new SolidParticleSystem('sps', scene)
    sps.computeParticleRotation = false
    //sps.computeParticleTexture = false
    sps.computeParticleVertex = false
    sps.addShape(disc, 1000)
    sps.updateParticle = particle => {
      particle.position.x = uniform(plane2.position.x, plane1.position.x)
      particle.position.y = uniform(0.03, 0.07)
      particle.position.z = uniform(-0.025, 0.025)

      let r = ((particle.position.y-0.05)**2 + particle.position.z**2)**0.5
      let d = particle.position.x
      let I = gaussian.intensity(r, d)

      //console.log(I)

      particle.color = new Color4(I, I, 1, 0)
      //particle.color = Color3.FromHexString(Color.Primary).toColor4()
      //particle.color.a = gaussian.intensity(r, d)
    }
    sps.buildMesh()
    sps.setParticles()

    disc.dispose()


    /*
    let disc = MeshBuilder.CreateDisc('disc',
      { radius: 0.02, sideOrientation: Mesh.DOUBLESIDE }, scene)
    disc.rotation.y = Math.PI / 2
    disc.position.x = -0.4
    disc.position.y = 0.05
    */

    scene.registerBeforeRender(() => {
      let dt = engine.getDeltaTime()
      //disc.convertToFlatShadedMesh()
    })

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
