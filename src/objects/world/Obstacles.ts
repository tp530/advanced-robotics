import { Cylinder } from "./Cylinder";
import { IObstacles } from "./IObstacles";

export class Obstacles implements IObstacles {
    cylinders: Array<Cylinder> = [];
    constructor(data: IObstacles) {
        if (Array.isArray(data.cylinders) && data.cylinders.length > 0) {
            for (const cylinder of data.cylinders) {
                this.cylinders.push(new Cylinder(cylinder));
            }

        }
    }
}
