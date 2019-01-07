import { Scene } from 'babylonjs'


export interface Builder {
  build(scene: Scene): void
}


export class Lambda implements Builder {

  private lambda: (scene: Scene) => void

  constructor(lambda: (scene: Scene) => void) {
    this.lambda = lambda
  }

  build(scene: Scene): void {
    this.lambda(scene)
  }

}
