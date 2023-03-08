import { Bounds3D } from "../../Bounds3D";
import { IWorld } from "./IWorld";
import { Obstacles } from "./Obstacles";
import { XYZ } from "./XYZ";

export class World implements IWorld {

    name: string;
    dimensions: XYZ;
    obstacles: Obstacles;

    constructor(data: IWorld) {
        this.name = data.name;
        this.dimensions = new XYZ(data.dimensions);
        this.obstacles = new Obstacles(data.obstacles);
    }

    get3DBoundaries(): Bounds3D {
        return Bounds3D.centredXZ(this.dimensions.x, this.dimensions.y, this.dimensions.z);
    }

}
