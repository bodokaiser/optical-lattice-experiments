import {
  ActionManager,
  ArcRotateCamera,
  DirectionalLight,
  ExecuteCodeAction,
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


let state = 0

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
      potential.position.y = 0.05
      potential.receiveShadows = true

      let shadow = new ShadowGenerator(1024, light)
      shadow.getShadowMap().renderList.push(potential)
      shadow.useContactHardeningShadow = true
      shadow.filteringQuality = ShadowGenerator.QUALITY_HIGH
      shadow.bias = 0.001
      shadow.normalBias = 0.005

      let atoms = createAtoms('sphere', scene)

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
            break
        }
      })

    }))
    .setupScene()
    .doRender()
})

if (module.hot) module.hot.accept(() => location.reload())

function createAtoms(name: string, scene: Scene) {
  let material = scene.getMaterialByName('metal') as StandardMaterial
  material.diffuseColor = new Color3(0.3, 0.3, 0.3)
  material.specularColor = new Color3(0.05, 0.05, 0.05)

  let sphere = MeshBuilder.CreateSphere(`${name}00`,
    { diameter: 0.03 }, scene)

  let spheres = [sphere]

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      let s = sphere.clone(`${name}${i}${j}`)
      s.position.x = 0.1 * i - 0.2
      s.position.y = 0.2
      s.position.z = 0.1 * j - 0.2

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
    { width: 0.6, height: 0.6, subdivisions: 500, updatable: true }, scene)
  ground.material = material

  let positions = ground.getVerticesData(VertexBuffer.PositionKind)
  let indices = ground.getIndices()
  let normals = []

  for (let i = 0; i < positions.length; i += 3) {
    let ux = Math.cos(10 * Math.PI * positions[i]) ** 2
    let uz = Math.cos(10 * Math.PI * positions[i + 2]) ** 2

    positions[i + 1] = 0.1 * ux * uz
  }

  VertexData.ComputeNormals(positions, indices, normals)

  ground.updateVerticesData(VertexBuffer.PositionKind, positions, false, true)
  ground.updateVerticesData(VertexBuffer.NormalKind, normals, false, false)

  return ground
}
