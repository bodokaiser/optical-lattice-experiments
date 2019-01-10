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

let state = 0

let gaussian = new GaussianBeam(150e-4, 30e-4)

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
      camera.minZ = 0.001
      camera.inertia = 0.1
      camera.upperRadiusLimit = 2
      camera.lowerRadiusLimit = 0.1
      camera.upperBetaLimit = 0.9 * Math.PI / 2
      camera.setPosition(new Vector3(1, 1, 1))
      camera.attachControl(canvas, true)

      let laser1 = createLaser('laser1', scene)
      laser1.position.x = -0.6
      laser1.position.y = 0.1

      let beam1a = createBeam('beam1a', scene, false)
      beam1a.rotation.y = Math.PI / 2
      beam1a.position.y = 0.1

      let beam1b = createBeam('beam1b', scene, true)
      beam1b.rotation.y = Math.PI / 2
      beam1b.position.y = 0.1

      let mirror1a = createMirror('mirror1a', scene)
      mirror1a.position.x = 0.5
      mirror1a.material = laser1.material
      mirror1a.position.y = 0.1

      let mirror1b = mirror1a.clone('mirror1b')
      mirror1b.material = scene.getMaterialByName('glass')
      mirror1b.position.x = -0.5

      let laser2 = laser1.clone('laser2')
      laser2.rotation.y = Math.PI / 2
      laser2.position.x = 0
      laser2.position.z = -0.6

      let beam2b = beam1b.clone('beam2b')
      beam2b.rotation.y = 0

      let mirror2a = mirror1b.clone('mirror2a')
      mirror2a.material = scene.getMaterialByName('glass')
      mirror2a.rotation.y = 0
      mirror2a.position.x = 0
      mirror2a.position.z = 0.5

      let mirror2b = mirror2a.clone('mirror2b')
      mirror2b.position.z = -0.5

      scene.actionManager = new ActionManager(scene)
      scene.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, e => {
          if (e.sourceEvent.type != 'keydown') return

          switch (e.sourceEvent.key) {
            case 'x':
              state++
              break
            case 'y':
              state--
          }

          console.log(state)
        }))

      scene.registerBeforeRender(() => {
        switch (state) {
          case 0:
            beam1a.isVisible = false
            beam1b.isVisible = false
            beam2b.isVisible = false
            laser1.isVisible = false
            laser2.isVisible = false
            mirror1a.isVisible = false
            mirror1b.isVisible = false
            mirror2a.isVisible = false
            mirror2b.isVisible = false
            break
          case 1:
            mirror1a.isVisible = false
            laser1.isVisible = true
            break
          case 2:
            beam1a.isVisible = false
            mirror1a.isVisible = true
            break
          case 3:
            beam1a.isVisible = true
            mirror1a.material = scene.getMaterialByName('metal')
            mirror1b.isVisible = false
            beam1a.isVisible = true
            beam1b.isVisible = false
            break
          case 4:
            beam1a.isVisible = false
            beam1b.isVisible = true
            beam2b.isVisible = false
            laser2.isVisible = false
            mirror1a.material = scene.getMaterialByName('glass')
            mirror1b.isVisible = true
            mirror2a.isVisible = false
            mirror2b.isVisible = false
            break
          case 5:
            beam1b.isVisible = true
            beam2b.isVisible = true
            laser1.isVisible = true
            laser2.isVisible = true
            mirror1a.isVisible = true
            mirror1b.isVisible = true
            mirror2a.isVisible = true
            mirror2b.isVisible = true
            break
          case 6:
            beam1b.isVisible = false
            beam2b.isVisible = false
            laser1.isVisible = false
            laser2.isVisible = false
            mirror1a.isVisible = false
            mirror1b.isVisible = false
            mirror2a.isVisible = false
            mirror2b.isVisible = false
            break
        }
      })

    }))
    .setupScene()
    .doRender()
})

if (module.hot) module.hot.accept(() => location.reload())

function createBeam(name: string, scene: Scene, standing = false) {
  let curve = []
  for (let i = 0; i < 1000; i++) {
    curve.push(new Vector3(0, 0, i / 1000 - 0.5))
  }

  let radius = (_, distance: number): number => {
    let z = distance - 0.5
    let r = gaussian.waist(z)

    if (standing) {
      r *= Math.cos(100 * Math.PI * z) ** 2
    }

    return r
  }

  let beam = MeshBuilder.CreateTube(name,
    { path: curve, radiusFunction: radius, cap: Mesh.CAP_ALL }, scene)
  beam.material = scene.getMaterialByID('standard')

  return beam
}

function createLaser(name: string, scene: Scene) {
  let laser = MeshBuilder.CreateCylinder(name,
    { height: 0.15, diameter: 0.12, tessellation: 40 }, scene)
  laser.material = scene.getMaterialByID('metal')
  laser.rotation.z = Math.PI / 2

  return laser
}

function createMirror(name: string, scene: Scene) {
  let mirror = MeshBuilder.CreatePlane(name,
    { size: 0.2, sideOrientation: Mesh.DOUBLESIDE }, scene)
  mirror.material = scene.getMaterialByID('glass')
  mirror.rotation.y = Math.PI / 2

  return mirror
}
