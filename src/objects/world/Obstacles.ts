import { CylinderDescription } from "./CylinderDescription";
import { IObstacles } from "./IObstacles";

export class Obstacles implements IObstacles {
    cylinders: Array<CylinderDescription> = [];
    constructor(data: IObstacles) {
        if (Array.isArray(data.cylinders) && data.cylinders.length > 0) {
            for (const cylinder of data.cylinders) {
                this.cylinders.push(new CylinderDescription(cylinder));
            }

        }
    }
}
