import {
  ActionManager,
  ArcRotateCamera,
  DirectionalLight,
  ExecuteCodeAction,
  FloatArray,
  Mesh,
  Scene,
  Color3,
  Color4,
  StandardMaterial,
  ShadowGenerator,
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
import { between } from './numeric'

let state = 0


// barrier segments are (x,z) coordinates which sit in the barrier
const SEGMENTS = [
  [-0.175, -0.175], [-0.1, -0.175], [0, -0.175], [0.1, -0.175], [0.15, -0.175],
  [0.175, -0.1], [0.175, 0], [0.175, 0.1], [0.175, 0.175],
  [0.1, 0.175], [0.0, 0.175], [-0.1, 0.175], [-0.175, 0.175],
  [-0.175, 0.1], [-0.175, 0.0], [-0.175, -0.1], [-0.175, -0.175]
]


window.addEventListener('load', () => {
  let canvas = document.getElementById('canvas') as HTMLCanvasElement

  new App(canvas)
    .registerBuilder(new Material.Grid('grid', Color.Background))
    .registerBuilder(new Material.Metal('metal', Color.Metal))
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

      let camera = new ArcRotateCamera('camera',
        -Math.PI / 2, Math.PI / 2, 1, Vector3.Zero(), scene)
      camera.setPosition(new Vector3(1, 1, 1))
      camera.attachControl(canvas, true)

      let potential = createPotential('potential', scene)
      potential.position.y = 0.15
      potential.receiveShadows = true

      updatePotential('potential', scene, (position: Vector3): Vector3 => {
        position.y = -0.1
        position.y *= Math.sin(10 * Math.PI * position.x) ** 2
        position.y *= Math.sin(10 * Math.PI * position.z) ** 2

        return position
      })

      let shadow = new ShadowGenerator(1024, light)
      shadow.getShadowMap().renderList.push(potential)
      shadow.useContactHardeningShadow = true
      shadow.filteringQuality = ShadowGenerator.QUALITY_HIGH
      shadow.bias = 0.001
      shadow.normalBias = 0.005

      let atoms = createAtoms('sphere', scene)
      atoms.forEach((atom: Mesh) => {
        atom.isVisible = false
      })

      scene.actionManager = new ActionManager(scene)
      scene.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, e => {
          if (e.sourceEvent.type != 'keydown') return
          if (e.sourceEvent.key != 'x') return

          console.log('state', state++)
        }))

      let perturbation = createPerturbation('perturbation', scene)
      perturbation.isVisible = false
      perturbation.position.y = 0.15

      let count = 0
      let index = 0

      scene.registerBeforeRender(() => {
        switch (state) {
          case 1:
            state++

            atoms.forEach((atom: Mesh) => atom.isVisible = Math.random() > 0.3)
            break
          case 3:
            atoms.forEach((atom: Mesh) => atom.isVisible = false)
            break
          case 4:
            state++

            updatePotential('potential', scene, (position: Vector3) => {
              if (isBarrier(position)) position.y = 0.15

              return position
            })
            break
          case 6:
            state++

            atoms.forEach((atom: Mesh) => {
              if (isNearBarrier(atom.position)) return

              atom.isVisible = Math.random() > 0.3
            })
            break
          case 8:
            state++

            atoms.forEach((atom: Mesh) => {
              atom.isVisible = false
            })
            updatePotential('potential', scene, (position: Vector3): Vector3 => {
              position.y = -0.1
              position.y *= Math.cos(10 * Math.PI * position.x) ** 2
              position.y *= Math.cos(10 * Math.PI * position.z) ** 2

              return position
            })

            break
          case 10:
            count += 1

            if (count % 4 == 0) {
              let [x, z] = SEGMENTS[index % SEGMENTS.length]

              perturbation.isVisible = true
              perturbation.position.x = x
              perturbation.position.z = z

              index += 1
            }

            break
          case 12:
            state++

            perturbation.isVisible = false
            updatePotential('potential', scene, (position: Vector3) => {
              if (isBarrier(position)) position.y = 0.15

              return position
            })

            break
        }
      })

    }))
    .setupScene()
    .doRender()
})

if (module.hot) module.hot.accept(() => location.reload())


function isBarrier(position: Vector3): boolean {
  if (between(position.x, -0.20, -0.15) && between(position.z, -0.2, +0.2)) {
    return true
  }
  if (between(position.x, +0.15, +0.20) && between(position.z, -0.2, +0.2)) {
    return true
  }
  if (between(position.z, +0.15, +0.20) && between(position.x, -0.2, +0.2)) {
    return true
  }
  if (between(position.z, -0.20, -0.15) && between(position.x, -0.2, +0.2)) {
    return true
  }

  return false
}


function isNearBarrier(position: Vector3, ): boolean {
  if (between(position.x, -0.25, -0.10) && between(position.z, -0.25, +0.25)) {
    return true
  }
  if (between(position.x, +0.10, +0.25) && between(position.z, -0.25, +0.25)) {
    return true
  }
  if (between(position.z, +0.10, +0.25) && between(position.x, -0.25, +0.25)) {
    return true
  }
  if (between(position.z, -0.25, -0.10) && between(position.x, -0.25, +0.25)) {
    return true
  }

  return false
}


function createAtoms(name: string, scene: Scene) {
  let material = scene.getMaterialByName('metal') as StandardMaterial
  material.diffuseColor = new Color3(0.3, 0.3, 0.3)
  material.specularColor = new Color3(0.05, 0.05, 0.05)

  let sphere = MeshBuilder.CreateSphere(`${name}00`,
    { diameter: 0.03 }, scene)

  let spheres = [sphere]

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      let s = sphere.clone(`${name}${i}${j}`)
      s.position.x = 0.1 * i - 0.25
      s.position.y = 0.15
      s.position.z = 0.1 * j - 0.25

      spheres.push(s)
    }
  }

  return spheres
}


function createPotential(name: string, scene: Scene) {
  let material = scene.getMaterialByName('standard') as StandardMaterial
  material.diffuseColor = Color3.FromHexString(Color.Glass)
  material.specularColor = new Color3(0.05, 0.05, 0.05)

  let ground = MeshBuilder.CreateGround(name,
    { width: 0.65, height: 0.65, subdivisions: 500, updatable: true }, scene)
  ground.material = material

  return ground
}


function createPerturbation(name: string, scene: Scene) {
  let material = scene.getMaterialByName('standard') as StandardMaterial
  material.diffuseColor = Color3.FromHexString(Color.Glass)
  material.specularColor = new Color3(0.05, 0.05, 0.05)

  let mesh = MeshBuilder.CreateCylinder(name,
    { diameter: 0.05, height: 0.2 }, scene)
  mesh.material = material

  return mesh
}


type Transform = (position: Vector3) => Vector3


function updatePotential(name: string, scene: Scene, transform: Transform) {
  let mesh = scene.getMeshByName(name)

  let positions = mesh.getVerticesData(VertexBuffer.PositionKind)
  let indices = mesh.getIndices()
  let normals = []

  for (let i = 0; i < positions.length; i += 3) {
    let position = transform(Vector3.FromArray(positions.slice(i, i + 3)))

    positions[i] = position.x
    positions[i + 1] = position.y
    positions[i + 2] = position.z
  }

  VertexData.ComputeNormals(positions, indices, normals)

  mesh.updateVerticesData(VertexBuffer.PositionKind, positions, false, true)
  mesh.updateVerticesData(VertexBuffer.NormalKind, normals, false, false)

  return mesh
}
