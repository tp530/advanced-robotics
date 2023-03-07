import { clamp } from "three/src/math/MathUtils";
import { Dropoff, DropoffOptions } from "./Dropoff";

export class ProportionalDropoff extends Dropoff{
    name = "Proportional Dropoff"
    func = "{base}-{const}*{dist}"

    base: number
    
    constructor(base: number, constant: number, options?: DropoffOptions){
        super(constant, options)
        this.base = base
    }

    fn(dist: number): number {
        return clamp(this.base - this.constant*dist, 0, this.base)
    }

}