import {
  Engine,
  Scene,
  Light,
  Color3,
  HemisphericLight,
  Vector3,
  FreeCamera,
  MeshBuilder,
  PBRMetallicRoughnessMaterial
} from 'babylonjs'
import {
  GridMaterial
} from 'babylonjs-materials'


class GameOptions {
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

  new Game(canvas, { background: '#f0f1eb' })
    .setupScene()
    .doRender()
})

if (module.hot) {
  module.hot.accept(() => {
    location.reload()
  })
}
