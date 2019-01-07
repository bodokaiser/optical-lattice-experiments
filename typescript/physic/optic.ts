export class GaussianBeam {

  private _waist0  : number
  private _rlength : number

  constructor(waist0 : number, lambda : number) {
    this._waist0 = waist0
    this._rlength = Math.PI * waist0**2 / lambda
  }

  waist(z : number) : number {
    if (z == 0) return this._waist0

    return this._waist0 * Math.sqrt(1 + (z/this._rlength)**2)
  }

  intensity(r : number, z : number) : number {
    let w0 = this.waist(0)
    let wz = this.waist(z)

    return (w0 / wz)**2 * Math.exp(-2 * (r / wz)**2)
  }

}
