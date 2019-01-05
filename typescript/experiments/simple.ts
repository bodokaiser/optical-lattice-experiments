import {
  ActionManager,
  Animation,
  ExecuteCodeAction,
  Mesh,
  Color3,
  Color4,
  MeshBuilder,
  PBRMetallicRoughnessMaterial,
  SolidParticleSystem,
} from 'babylonjs'
import colormap from 'colormap'
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
    cylinder.isVisible = false

    let plane1 = MeshBuilder.CreatePlane('plane1',
      { width: 0.1, height: 0.1, sideOrientation: Mesh.DOUBLESIDE }, scene)
    plane1.material = glass
    plane1.rotation.y = Math.PI / 2
    plane1.position.x = -0.39
    plane1.position.y = 0.05
    plane1.isVisible = false

    let plane2 = plane1.clone()
    plane2.position.x = 0.5

    let gaussian = new GaussianBeam(2e-2, 1000e-9)
    let colors = colormap({
        colormap: 'viridis',
        nshades: 255,
        format: 'float',
        alpha: 1
    })

    let disc = MeshBuilder.CreateDisc('disc',
      { radius: 1e-3 }, scene)

    let state = 0

    let sps = new SolidParticleSystem('sps', scene)
    sps.computeParticleRotation = false
    sps.computeParticleTexture = false
    sps.computeParticleVertex = false
    sps.addShape(disc, 10000)
    sps.updateParticle = particle => {
      particle.position.x = uniform(plane2.position.x, plane1.position.x)
      particle.position.y = uniform(0.03, 0.07)
      particle.position.z = uniform(-0.025, 0.025)

      let r = ((particle.position.y-0.05)**2 + particle.position.z**2)**0.5
      let d = particle.position.x
      let I = gaussian.intensity(r, d)

      if (plane2.isVisible) I *= Math.cos(50*Math.PI*d)**2

      let color = colors[Math.floor(255*I)]
      color[3] = I

      particle.color = Color4.FromArray(color)
    }
    sps.buildMesh()
    sps.mesh.hasVertexAlpha = true

    disc.dispose()

    scene.actionManager = new ActionManager(scene)
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, e => {
        if (e.sourceEvent.type != 'keydown') return
        if (e.sourceEvent.key != 'x') return

        console.log('state', state++)
      }))

    scene.registerBeforeRender(() => {
      if (state > 1) sps.setParticles()

      switch (state) {
        case 1:
          cylinder.isVisible = true
          break
        case 3:
          plane1.isVisible = true
          plane2.isVisible = true
          break
      }
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
