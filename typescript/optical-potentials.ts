import {
  ActionManager,
  ArcRotateCamera,
  ExecuteCodeAction,
  Mesh,
  Scene,
  Color3,
  Color4,
  DirectionalLight,
  MeshBuilder,
  Vector3,
  VertexBuffer,
  VertexData,
} from 'babylonjs'

import {
  App,
  Color,
} from './app'
import {
  Lambda,
} from './builder'
import * as Material from './material'
import * as Geometry from './geometry'
import { GaussianBeam } from './physic/optic'

let gaussian = new GaussianBeam(0.02, 4e-3)

let state = 0

window.addEventListener('load', () => {
  let canvas = document.getElementById('canvas') as HTMLCanvasElement

  new App(canvas)
    .registerBuilder(new Material.Grid('grid', Color.Background))
    .registerBuilder(new Material.Metal('metal', Color.Metal))
    .registerBuilder(new Material.Standard('glass', Color.Glass, 0.3))
    .registerBuilder(new Material.Standard('standard', Color.Glass))
    .registerBuilder(new Geometry.Ground('grid', 'grid'))
    .registerBuilder(new Lambda((scene: Scene) => {
      scene.clearColor = Color3.FromHexString(Color.Background).toColor4()
      scene.shadowsEnabled = true

      let light = new DirectionalLight('light', new Vector3(-1, -2, 1), scene)
      light.intensity = 0.9
      light.position = new Vector3(1, 5, -1)
      light.shadowMinZ = 0
      light.shadowMaxZ = 10

      let camera = new ArcRotateCamera('camera', 0, 0, 1, Vector3.Zero(), scene)
      camera.minZ = 0.01
      camera.inertia = 0.1
      camera.upperRadiusLimit = 2
      camera.lowerRadiusLimit = 0.1
      camera.upperBetaLimit = 0.9 * Math.PI / 2
      camera.setPosition(new Vector3(1, 1, 1))
      camera.attachControl(canvas, true)

      let laser1 = createLaser('laser1', scene)
      laser1.position.x = -0.45
      laser1.position.y = 0.1
      laser1.isVisible = true

      let beam1 = createBeamDiscs('beam1', scene)
      //beam1.position.y = 0.1

      let mirror1 = createMirror('mirror1', scene)
      mirror1.position.x = -0.39
      mirror1.position.y = 0.05
      mirror1.isVisible = false

      let mirror2 = mirror1.clone('mirror2')
      mirror2.position.x = 0.5

      let potential1 = createPotential('potential1', scene)
      potential1.position.x = 0.055
      potential1.position.y = 0.05
      potential1.isVisible = false

      let laser2 = laser1.clone('laser2')
      laser2.rotation.y = Math.PI / 2
      laser2.position.x = 0
      laser2.position.z = -0.45

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
        switch (state) {
          case 1:
            laser1.isVisible = true
            break
          case 3:
            mirror1.isVisible = true
            mirror2.isVisible = true
            break
          case 4:
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

function createBeamTube(name: string, scene: Scene) {
  let curve = []
  for (let i = 0; i < 100; i++) {
    curve.push(new Vector3(0, 0, i / 100 - 0.5))
  }

  let radius = (index: number, distance: number): number => {
    return gaussian.waist(distance - 0.5)
  }

  let beam = MeshBuilder.CreateTube('beam1',
    { path: curve, radiusFunction: radius, cap: Mesh.CAP_ALL }, scene)
  beam.material = scene.getMaterialByID('standard')

  return beam
}

function createBeamDiscs(name: string, scene: Scene) {
  let discs = []

  for (let i = 0; i < 100; i++) {
    let d = 1e-2 * i - 0.5

    let disc = MeshBuilder.CreateCylinder(`${name}${i}`,
      { diameter: gaussian.waist(d), height: 1e-2 }, scene)
    disc.material = scene.getMaterialByID('standard')
    disc.position.y = 0.1
    disc.position.x = d
    disc.rotation.z = Math.PI / 2

    discs.push(disc)
  }

  return discs
}

function createLaser(name: string, scene: Scene) {
  let laser = MeshBuilder.CreateCylinder(name,
    { height: 0.15, diameter: 0.1 }, scene)
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
