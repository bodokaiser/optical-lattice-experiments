import { Scene } from 'babylonjs'

import { Builder } from '../builder'


export default abstract class Abstract implements Builder {

  protected name: string
  protected color: string

  constructor(name: string, color: string) {
    this.name = name
    this.color = color
  }

  abstract build(scene: Scene): void

}
