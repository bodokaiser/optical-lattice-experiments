import {
  ActionManager,
  Animation,
  ArcRotateCamera,
  Color3,
  Color4,
  CSG,
  DirectionalLight,
  ExecuteCodeAction,
  Mesh,
  MeshBuilder,
  Scene,
  SolidParticleSystem,
  StandardMaterial,
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
import { uniform } from './numeric'
import { GaussianBeam } from './physic/optic'

let time = 0
let state = 0

let gaussian = new GaussianBeam(150e-4, 30e-4)

window.addEventListener('message', e => {
  let message = JSON.parse(e.data)

  console.log(message)

  if (message.namespace === 'reveal') {
    switch (message.eventName) {
      case 'fragmentshown':
        state++
        break
      case 'fragmenthidden':
        state--
        break
      case 'reset':
        state = 0
    }
  }
})

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
      camera.inputs.clear()
      camera.inputs.addMouseWheel()
      camera.inputs.addPointers()
      camera.attachControl(canvas, true)

      let grid = scene.getMeshByName('grid')

      let laser1 = createLaser('laser1', scene)
      laser1.position.x = -0.6
      laser1.position.y = 0.1

      let beam1a = createBeam('beam1a', scene, false)
      beam1a.rotation.y = Math.PI / 2
      beam1a.position.y = 0.1

      let beam1b = createBeam('beam1b', scene, true)
      beam1b.rotation.y = Math.PI / 2
      beam1b.position.y = 0.1

      let mirror1 = createMirror('mirror1a', scene)
      mirror1.position.x = 0.5
      mirror1.material = laser1.material
      mirror1.position.y = 0.1

      let laser2 = laser1.clone('laser2')
      laser2.rotation.y = Math.PI / 2
      laser2.position.x = 0
      laser2.position.z = -0.6

      let beam2b = beam1b.clone('beam2b')
      beam2b.rotation.y = 0

      let mirror2 = mirror1.clone('mirror2')
      mirror2.material = scene.getMaterialByName('glass')
      mirror2.rotation.y = 0
      mirror2.position.x = 0
      mirror2.position.z = 0.5

      let potential = createPotential('potential', scene)

      let atoms = createAtoms('atoms', scene)

      let box = createBoxPotential('box', scene)
      box.position.y = 0.05
      box.rotation.y = Math.PI / 2

      let trap = createTrapPotential('trap', scene)
      trap.position.y = 0.05

      let barrier = createBarrierPotential('barrier', scene)
      barrier.position.y = 0.05

      let step = 0.1

      let animation = new Animation('animation', 'position',
        10, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE)
      animation.setKeys([
        { frame: 0, value: new Vector3(step, 0.05, step) },
        { frame: 1, value: new Vector3(0.0, 0.05, step) },
        { frame: 2, value: new Vector3(-step, 0.05, step) },
        { frame: 3, value: new Vector3(step, 0.05, 0.0) },
        { frame: 4, value: new Vector3(0.0, 0.05, 0.0) },
        { frame: 5, value: new Vector3(-step, 0.05, 0.0) },
        { frame: 6, value: new Vector3(step, 0.05, -step) },
        { frame: 7, value: new Vector3(0.0, 0.05, -step) },
        { frame: 8, value: new Vector3(step, 0.05, -step) }
      ])

      let perturbation = createPerturbationPotential('perturbation', scene)
      perturbation.position.y = 0.05
      perturbation.animations.push(animation)

      scene.actionManager = new ActionManager(scene)
      scene.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, e => {
          if (e.sourceEvent.type != 'keydown') return

          switch (e.sourceEvent.keyCode) {
            // page down, right, down
            case 34: case 39: case 40:
              state++
              break
            // page up, left, up
            case 33: case 37: case 38:
              state--
          }

          console.log(state)
        }))

      scene.registerBeforeRender(() => {
        time += scene.getEngine().getDeltaTime()

        switch (state) {
          case 0:
            grid.isVisible = true
            atoms.isVisible = false
            beam1a.isVisible = false
            beam1b.isVisible = false
            beam2b.isVisible = false
            laser1.isVisible = false
            laser2.isVisible = false
            mirror1.isVisible = false
            mirror2.isVisible = false
            potential.isVisible = false
            box.isVisible = false
            trap.isVisible = false
            barrier.isVisible = false
            perturbation.isVisible = false
            break
          case 1:
            laser1.isVisible = true
            mirror1.isVisible = true
            break
          case 2:
            beam1a.isVisible = true
            mirror1.material = scene.getMaterialByName('metal')
            beam1a.isVisible = true
            beam1b.isVisible = false
            break
          case 3:
            beam1a.isVisible = false
            beam1b.isVisible = true
            beam2b.isVisible = false
            laser2.isVisible = false
            mirror1.material = scene.getMaterialByName('glass')
            mirror2.isVisible = false
            break
          case 4:
            beam1b.isVisible = true
            beam2b.isVisible = true
            laser1.isVisible = true
            laser2.isVisible = true
            mirror1.isVisible = true
            mirror2.isVisible = true
            break
          case 5:
            box.isVisible = false
            barrier.isVisible = false
            grid.isVisible = true
            atoms.isVisible = false
            beam1a.isVisible = false
            beam1b.isVisible = false
            beam2b.isVisible = false
            laser1.isVisible = false
            laser2.isVisible = false
            mirror1.isVisible = false
            mirror2.isVisible = false
            potential.isVisible = false
            perturbation.isVisible = false
            break
          case 6:
            grid.isVisible = false
            atoms.isVisible = false
            potential.isVisible = true
            break
          case 7:
            atoms.isVisible = true
            break
          case 8:
            box.isVisible = false
            atoms.isVisible = false
            break
          case 9:
            box.isVisible = true
            break
          case 10:
            box.isVisible = true
            box.position.z = 0.3 * Math.cos(0.001 * time)
            trap.isVisible = false
            barrier.isVisible = false
            break
          case 11:
            box.isVisible = false
            trap.isVisible = true
            break
          case 12:
            trap.scaling.x = Math.cos(0.001 * time) ** 2 + 0.5
            trap.scaling.z = Math.cos(0.001 * time) ** 2 + 0.5
            barrier.isVisible = false
            break
          case 13:
            trap.isVisible = false
            box.isVisible = false
            barrier.isVisible = true
            perturbation.isVisible = false
            break
          case 14:
            barrier.isVisible = false
            perturbation.isVisible = true
            scene.beginAnimation(perturbation, 0, 100, true)
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

function createAtom(name: string, scene: Scene) {
  let material = scene.getMaterialByName('metal') as StandardMaterial
  material.diffuseColor = new Color3(0.3, 0.3, 0.3)
  material.specularColor = new Color3(0.05, 0.05, 0.05)

  let sphere = MeshBuilder.CreateSphere(name, { diameter: 0.03 }, scene)
  sphere.material = material

  return sphere
}


function createAtoms(name: string, scene: Scene) {
  let atoms = new SolidParticleSystem(name, scene)
  let atom = createAtom('atom', scene)

  atoms.addShape(atom, 50)
  atom.dispose()
  atoms.computeParticleRotation = false
  atoms.computeParticleTexture = false
  atoms.computeParticleColor = false
  atoms.updateParticle = (atom) => {
    atom.position.x = Math.round(uniform(-4, +4)) / 10
    atom.position.z = Math.round(uniform(-4, +4)) / 10
  }
  atoms.buildMesh()
  atoms.setParticles()

  return atoms.mesh
}


function createPotential(name: string, scene: Scene) {
  let material = scene.getMaterialByName('standard') as StandardMaterial
  material.diffuseColor = Color3.FromHexString(Color.Glass)
  material.specularColor = new Color3(0.05, 0.05, 0.05)

  let ground = MeshBuilder.CreateGround(name,
    { width: 1.02, height: 1.02, subdivisions: 500, updatable: true }, scene)
  ground.material = material

  let positions = ground.getVerticesData(VertexBuffer.PositionKind)
  let indices = ground.getIndices()
  let normals = []

  for (let i = 0; i < positions.length; i += 3) {
    let k = 10 * Math.PI
    let x = positions[i] - 0.5
    let z = positions[i + 2] - 0.5

    positions[i + 1] += -0.05 * (Math.cos(k * x) ** 2 + Math.cos(k * z) ** 2)
  }

  VertexData.ComputeNormals(positions, indices, normals)

  ground.updateVerticesData(VertexBuffer.PositionKind, positions, false, true)
  ground.updateVerticesData(VertexBuffer.NormalKind, normals, false, false)

  return ground
}


function createBoxPotential(name: string, scene: Scene) {
  let box = MeshBuilder.CreateBox(name,
    { width: 0.05, height: 0.2, depth: 0.5 }, scene)
  box.material = scene.getMaterialByName('standard')

  return box
}


function createTrapPotential(name: string, scene: Scene) {
  let box1 = MeshBuilder.CreateBox(name,
    { width: 0.5, height: 0.2, depth: 0.5 }, scene)
  let box2 = MeshBuilder.CreateBox(name,
    { width: 0.4, height: 0.2, depth: 0.4 }, scene)

  let csg1 = CSG.FromMesh(box1)
  let csg2 = CSG.FromMesh(box2)

  let trap = csg1
    .subtract(csg2)
    .toMesh(name, scene.getMaterialByName('standard'), scene, true)

  box1.dispose()
  box2.dispose()

  return trap
}


function createBarrierPotential(name: string, scene: Scene) {
  let barrier = MeshBuilder.CreateBox(name,
    { width: 0.3, height: 0.2, depth: 0.3 }, scene)
  barrier.material = scene.getMaterialByName('standard')

  return barrier
}


function createPerturbationPotential(name: string, scene: Scene) {
  let perturbation = MeshBuilder.CreateCylinder(name,
    { diameter: 0.1, height: 0.3 }, scene)
  perturbation.material = scene.getMaterialByName('standard')

  return perturbation
}
