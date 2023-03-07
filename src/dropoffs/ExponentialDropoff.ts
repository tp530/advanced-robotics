import { Dropoff } from "./Dropoff";

export class ExponentialDropoff extends Dropoff{
    name = "Exponential Dropoff"
    func = "{const}^(-{dist})"

    fn(dist: number): number {
        return Math.exp(-dist)/Math.exp(this.constant)
    }

}