import {
  Engine,
  Mesh,
  Scene,
  Light,
  Color3,
  HemisphericLight,
  Vector3,
  FreeCamera,
  MeshBuilder,
  PBRMetallicRoughnessMaterial,
  SolidParticleSystem,
  SolidParticle
} from 'babylonjs'
import {
  GridMaterial
} from 'babylonjs-materials'


class GameOptions {
  particle: string
  background: string
}

class Game {
  private _canvas: HTMLCanvasElement
  private _engine: Engine
  private _scene: Scene
  private _camera: FreeCamera
  private _light: Light
  private _options: GameOptions

  constructor(element : HTMLCanvasElement, options : GameOptions) {
    this._canvas = element
    this._options = options
    this._engine = new Engine(element, true)
    this._engine.setHardwareScalingLevel(0.5)
  }

  setupScene() : Game {
    this._scene = new Scene(this._engine)
    this._scene.clearColor = Color3
      .FromHexString(this._options.background)
      .toColor4()

    this._camera = new FreeCamera('camera',
      new Vector3(0, 0.5, -1), this._scene)
    this._camera.minZ = .1
    this._camera.speed = 0.1
    this._camera.setTarget(Vector3.Zero())
    this._camera.attachControl(this._canvas, false)

    this._light = new HemisphericLight('light',
      new Vector3(0, 1, 0), this._scene)

    let pbr = new PBRMetallicRoughnessMaterial('pbr', this._scene)
    pbr.metallic = 1.0
    pbr.roughness = 1.0

    let glass = new BABYLON.StandardMaterial("glass", this._scene);
    glass.diffuseColor = new Color3(0, 0, 0)
    glass.specularPower = 150
    glass.emissiveColor = new Color3(0.15, 0.15, 0.15)
    glass.alpha = 0.5

    let grid = new GridMaterial('grid', this._scene)
    grid.gridRatio = 0.1
    grid.mainColor = Color3.FromHexString(this._options.background)
    grid.lineColor = Color3.Black()

    let ground = MeshBuilder.CreateGround('ground',
      { width: 1, height: 1 }, this._scene)
    ground.material = grid

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

    var sphere = MeshBuilder.CreateSphere('sphere',
      { diameter: 0.01 }, this._scene)

    let sps = new SolidParticleSystem('sps', this._scene)
    sps.addShape(sphere, 20)
    sps.updateParticle = (particle) => {
      particle.position.x = Math.random() - 0.5
      particle.position.y = Math.random() - 0.5
      particle.position.z = Math.random() - 0.5

      return particle
    }
    sps.buildMesh()
    sps.setParticles()

    sphere.dispose()

    return this
  }

  doRender() : Game {
    this._engine.runRenderLoop(() => {
      this._scene.render()
    })

    window.addEventListener('resize', () => {
      this._engine.resize()
    })

    return this
  }
}

window.addEventListener('load', () => {
  let canvas = document.getElementById('canvas') as HTMLCanvasElement

  new Game(canvas, { background: '#f0f1eb', particle: '#1b91ff' })
    .setupScene()
    .doRender()
})

if (module.hot) {
  module.hot.accept(() => {
    location.reload()
  })
}
