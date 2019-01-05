import {
  Engine,
  Scene,
  Light,
  Color3,
  Color4,
  HemisphericLight,
  Vector3,
  FreeCamera,
  MeshBuilder,
  DefaultRenderingPipeline
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
  private _pipeline: DefaultRenderingPipeline
  private _options: GameOptions

  constructor(element : HTMLCanvasElement, options : GameOptions) {
    this._canvas = element
    this._options = options
    this._engine = new Engine(element, true)
  }

  setupScene() : Game {
    this._scene = new Scene(this._engine)
    this._scene.clearColor = Color3
      .FromHexString(this._options.background)
      .toColor4()

    this._camera = new FreeCamera('camera1',
      new Vector3(0, 0.5, -1), this._scene)
    this._camera.minZ = .1
    this._camera.speed = 1
    this._camera.setTarget(Vector3.Zero())
    this._camera.attachControl(this._canvas, false)

    this._light = new HemisphericLight('light1',
      new Vector3(0, 1, 0), this._scene)

    this._pipeline = new DefaultRenderingPipeline('default',
      true, this._scene, [this._camera])
    this._pipeline.samples = 4
    this._pipeline.sharpenEnabled = true

    let grid = new GridMaterial('grid', this._scene)
    grid.gridRatio = 0.1
    grid.mainColor = Color3.FromHexString(this._options.background)
    grid.lineColor = Color3.Black()

    let ground = MeshBuilder.CreateGround('ground',
      { width: 1, height: 1 }, this._scene)
    ground.material = grid

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