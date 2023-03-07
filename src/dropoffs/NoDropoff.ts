import { Dropoff } from "./Dropoff";

export class NoDropoff extends Dropoff{
    name = "No Dropoff"
    func = "{const}"

    fn(_dist: number): number {
        return this.constant;
    }

}