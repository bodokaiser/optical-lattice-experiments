import {
  ActionManager,
  ExecuteCodeAction,
  Mesh,
  Scene,
  Color3,
  Color4,
  MeshBuilder,
  SolidParticle,
  SolidParticleSystem,
  VertexBuffer,
  VertexData,
} from 'babylonjs'
import colormap from 'colormap'

import {
  App,
  Color,
} from './app'
import {
  Lambda,
} from './builder'
import * as Material from './material'
import * as Geometry from './geometry'
import { uniform } from './numeric/random'
import { GaussianBeam } from './physic/optic'


let state = 0

window.addEventListener('load', () => {
  let canvas = document.getElementById('canvas') as HTMLCanvasElement

  let gaussian = new GaussianBeam(2e-2, 1000e-9)
  let colors = colormap({
    colormap: 'viridis',
    nshades: 255,
    format: 'float',
    alpha: 1
  })

  new App(canvas)
    .registerBuilder(new Material.Grid('grid', Color.Background))
    .registerBuilder(new Material.Metal('metal', Color.Metal))
    .registerBuilder(new Material.Standard('glass', Color.Glass, 0.3))
    .registerBuilder(new Material.Standard('standard', Color.Glass))
    .registerBuilder(new Geometry.Ground('grid', 'grid'))
    .registerBuilder(new Lambda((scene: Scene) => {
      scene.clearColor = Color3.FromHexString(Color.Background).toColor4()

      let laser1 = createLaser('laser1', scene)
      laser1.position.x = -0.45
      laser1.position.y = 0.05
      laser1.isVisible = false

      let mirror1 = createMirror('mirror1', scene)
      mirror1.position.x = -0.39
      mirror1.position.y = 0.05
      mirror1.isVisible = false

      let mirror2 = mirror1.clone('mirror2')
      mirror2.position.x = 0.5

      let photons = createPhotons('photons', scene)
      photons.updateParticle = (particle: SolidParticle): SolidParticle => {
        particle.position.x = uniform(mirror2.position.x, mirror1.position.x)
        particle.position.y = uniform(0.03, 0.07)
        particle.position.z = uniform(-0.025, 0.025)

        let r = ((particle.position.y - 0.05) ** 2 + particle.position.z ** 2) ** 0.5
        let d = particle.position.x
        let I = gaussian.intensity(r, d)

        if (mirror2.isVisible) I *= Math.cos(50 * Math.PI * d) ** 2

        let color = colors[Math.floor(255 * I)]
        color[3] = I

        particle.color = Color4.FromArray(color)

        return particle
      }
      photons.buildMesh()
      photons.mesh.hasVertexAlpha = true

      let potential1 = createPotential('potential1', scene)
      potential1.position.x = 0.055
      potential1.position.y = 0.05
      potential1.isVisible = false

      let laser2 = laser1.clone('laser2')
      laser2.rotation.y = Math.PI / 2
      laser2.position.x = 0
      laser2.position.z = 0.45

      let mirror3 = mirror1.clone('mirror3')
      mirror3.rotation.y = 0
      mirror3.position.x = 0
      mirror3.position.z = 0.39

      let mirror4 = mirror3.clone('mirror4')
      mirror4.position.z = -0.5

      let potential2 = potential1.clone('potential2')
      potential2.rotation.y = Math.PI / 2
      potential2.position.x = 0
      potential2.position.z = -0.055

      scene.actionManager = new ActionManager(scene)
      scene.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, e => {
          if (e.sourceEvent.type != 'keydown') return
          if (e.sourceEvent.key != 'x') return

          console.log('state', state++)
        }))

      scene.registerBeforeRender(() => {
        if (state > 1 && state < 4) photons.setParticles()

        switch (state) {
          case 1:
            laser1.isVisible = true
            break
          case 3:
            mirror1.isVisible = true
            mirror2.isVisible = true
            break
          case 4:
            photons.mesh.isVisible = false
            potential1.isVisible = true
            break
          case 5:
            laser2.isVisible = true
            mirror3.isVisible = true
            mirror4.isVisible = true
            potential2.isVisible = true
            break
        }
      })

    }))
    .setupScene()
    .doRender()
})

if (module.hot) module.hot.accept(() => location.reload())

function createLaser(name: string, scene: Scene) {
  let laser = MeshBuilder.CreateCylinder(name,
    { height: 0.1, diameter: 0.05 }, scene)
  laser.material = scene.getMaterialByID('metal')
  laser.rotation.z = Math.PI / 2

  return laser
}

function createMirror(name: string, scene: Scene) {
  let mirror = MeshBuilder.CreatePlane(name,
    { size: 0.1, sideOrientation: Mesh.DOUBLESIDE }, scene)
  mirror.material = scene.getMaterialByID('glass')
  mirror.rotation.y = Math.PI / 2

  return mirror
}

function createPhotons(name: string, scene: Scene) {
  let disc = MeshBuilder.CreateDisc('disc', { radius: 1e-3 }, scene)

  let photons = new SolidParticleSystem('photons', scene)
  photons.computeParticleRotation = false
  photons.computeParticleTexture = false
  photons.computeParticleVertex = false
  photons.addShape(disc, 10000)

  disc.dispose()

  return photons
}

function createPotential(name: string, scene: Scene) {
  let x1 = scene.getMeshByName('mirror1').position.x
  let x2 = scene.getMeshByName('mirror2').position.x

  let ground = MeshBuilder.CreateGround(name,
    { width: x2 - x1, height: 0.05, subdivisions: 500 }, scene)
  ground.material = scene.getMaterialByID('standard')

  let positions = ground.getVerticesData(VertexBuffer.PositionKind)
  let indices = ground.getIndices()
  let normals = []

  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] = 0.01 * Math.cos(50 * Math.PI * positions[i]) ** 2
  }

  VertexData.ComputeNormals(positions, indices, normals)

  ground.updateVerticesData(VertexBuffer.PositionKind, positions, false, true)
  ground.updateVerticesData(VertexBuffer.NormalKind, normals, false, false)

  return ground
}
