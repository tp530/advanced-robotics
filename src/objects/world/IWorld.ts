import { IObstacles } from "./IObstacles";
import { IXYZ } from "./IXYZ";

export interface IWorld {
    name: string;
    dimensions: IXYZ;
    obstacles: IObstacles;
}
