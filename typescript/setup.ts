import {
  Engine,
  Scene,
  Light,
  Color3,
  HemisphericLight,
  Vector3,
  FreeCamera,
  MeshBuilder,
  PBRMetallicRoughnessMaterial,
} from 'babylonjs'
import { GridMaterial } from 'babylonjs-materials'
import { Color } from './theme'

export class Setup {
  private _canvas : HTMLCanvasElement
  private _engine : Engine
  private _scene  : Scene
  private _camera : FreeCamera
  private _light  : Light

  constructor(element : HTMLCanvasElement) {
    this._canvas = element
    this._engine = new Engine(element, true)
    this._engine.setHardwareScalingLevel(0.5)
  }

  Scene() : Scene {
    return this._scene
  }

  Light() : Light {
    return this._light
  }

  Engine() : Engine {
    return this._engine
  }

  setupScene() : Setup {
    this._scene = new Scene(this._engine)
    this._scene.clearColor = Color3
      .FromHexString(Color.Background.toString())
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

    let glass = new BABYLON.StandardMaterial("glass", this._scene)
    glass.diffuseColor = new Color3(0, 0, 0)
    glass.specularPower = 150
    glass.emissiveColor = new Color3(0.15, 0.15, 0.15)
    glass.alpha = 0.5

    let grid = new GridMaterial('grid', this._scene)
    grid.gridRatio = 0.1
    grid.mainColor = Color3.FromHexString(Color.Background.toString())
    grid.lineColor = Color3.Black()

    let ground = MeshBuilder.CreateGround('ground',
      { width: 1, height: 1 }, this._scene)
    ground.material = grid

    return this
  }

  doRender() : Setup {
    this._engine.runRenderLoop(() => {
      this._scene.render()
    })

    window.addEventListener('resize', () => {
      this._engine.resize()
    })

    return this
  }

}
