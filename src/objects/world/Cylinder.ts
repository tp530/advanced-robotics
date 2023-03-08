import { ICylinder } from "./ICylinder";
import { XYZ } from "./XYZ";

export class Cylinder implements ICylinder {
    basePoint: XYZ;
    diameter: number;
    height: number;
    constructor(data: ICylinder) {
        this.basePoint = new XYZ(data.basePoint);
        this.diameter = data.diameter;
        this.height = data.height;
    }
}
