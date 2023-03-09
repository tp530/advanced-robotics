import { ICylinderDescription } from "./ICylinderDescription";
import { XYZ } from "./XYZ";

export class CylinderDescription implements ICylinderDescription {
    basePoint: XYZ;
    radius: number;
    height: number;
    constructor(data: ICylinderDescription) {
        this.basePoint = new XYZ(data.basePoint);
        this.radius = data.radius;
        this.height = data.height;
    }
}
