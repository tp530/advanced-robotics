import { IXYZ } from "./IXYZ";

export class XYZ implements IXYZ {
    x: number;
    y: number;
    z: number;
    constructor(data: IXYZ) {
        this.x = data.x;
        this.y = data.y;
        this.z = data.z;
    }
}
