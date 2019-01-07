import {
  ActionManager,
  ExecuteCodeAction,
  Mesh,
  Scene,
  Color3,
  Color4,
  MeshBuilder,
  SolidParticleSystem,
  StandardMaterial,
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
    .registerBuilder(new Material.Glass('glass', Color.Glass))
    .registerBuilder(new Material.Metal('metal', Color.Metal))
    .registerBuilder(new Geometry.Ground('grid', 'grid'))
    .registerBuilder(new Lambda((scene: Scene) => {
      scene.clearColor = Color3.FromHexString(Color.Background).toColor4()

      let laser = MeshBuilder.CreateCylinder('laser',
        { height: 0.1, diameter: 0.05 }, scene)
      laser.material = scene.getMaterialByID('metal')
      laser.rotation.z = Math.PI / 2
      laser.position.x = -0.45
      laser.position.y = 0.05
      laser.isVisible = false

      let mirror1 = MeshBuilder.CreatePlane('mirror1',
        { size: 0.1, sideOrientation: Mesh.DOUBLESIDE }, scene)
      mirror1.material = scene.getMaterialByID('glass')
      mirror1.rotation.y = Math.PI / 2
      mirror1.position.x = -0.39
      mirror1.position.y = 0.05
      mirror1.isVisible = false

      let mirror2 = mirror1.clone()
      mirror2.position.x = 0.5

      let disc = MeshBuilder.CreateDisc('disc',
        { radius: 1e-3 }, scene)

      let sps = new SolidParticleSystem('sps', scene)
      sps.computeParticleRotation = false
      sps.computeParticleTexture = false
      sps.computeParticleVertex = false
      sps.addShape(disc, 10000)
      sps.updateParticle = particle => {
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
      }
      sps.buildMesh()
      sps.mesh.hasVertexAlpha = true

      disc.dispose()

      let standard = new StandardMaterial('standard', scene)
      standard.diffuseColor = Color3.FromHexString(Color.Glass)

      let ground1 = MeshBuilder.CreateGround('ground1',
        {
          width: mirror2.position.x - mirror1.position.x,
          height: 0.1, subdivisions: 500
        }, scene)
      ground1.material = standard
      ground1.position.x = 0.055
      ground1.position.y = 0.05
      ground1.isVisible = false

      let positions1 = ground1.getVerticesData(VertexBuffer.PositionKind)
      let indices1 = ground1.getIndices()

      for (let i = 0; i < positions1.length; i += 3) {
        positions1[i + 1] = 0.01 * Math.cos(50 * Math.PI * positions1[i]) ** 2
      }

      ground1.updateVerticesData(VertexBuffer.PositionKind,
        positions1, false, true)

      let normals = []
      VertexData.ComputeNormals(positions1, indices1, normals)
      ground1.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, false, false)

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
            laser.isVisible = true
            break
          case 3:
            mirror1.isVisible = true
            mirror2.isVisible = true
            break
          case 4:
            sps.mesh.isVisible = false
            ground1.isVisible = true
            break
        }
      })

    }))
    .setupScene()
    .doRender()
})

if (module.hot) module.hot.accept(() => location.reload())
