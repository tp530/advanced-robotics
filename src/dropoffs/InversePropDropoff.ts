import { Dropoff } from "./Dropoff";

export class InversePropDropoff extends Dropoff{
    name = "Inversely Proportional Dropoff"
    func = "{const}/{dist}"

    fn(dist: number): number {
        return this.constant/dist
    }

}