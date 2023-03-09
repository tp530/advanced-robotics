import { Rule, RuleArguments } from "./Rule";
import * as THREE from "three";
import { Boid } from "../objects/Boid";

export class CohesionRule extends Rule {
    readonly name = "Cohesion";

    calculateVector(thisBoid: Boid, args: RuleArguments): THREE.Vector3 {
        // no cohesion force if there are no visible neighbours
        if (args.neighbours.length === 0) {
            return new THREE.Vector3();
        }
        // calculate centre of visible boids
        const centre = new THREE.Vector3();
        let weightSum = 0;
        for (const neighbour of args.neighbours) {
            let toOther = thisBoid.toOther(neighbour, args.simParams)
            let weight = args.simParams.dropoffRule.fn(toOther.length());
            centre.addScaledVector(thisBoid.position.clone().addScaledVector(toOther, -1), weight);
            weightSum += weight
        }
        if (weightSum == 0) return new THREE.Vector3()
        centre.divideScalar(weightSum);
        //console.log(centre)
        // cohesion force is towards the calculated centre
        centre.sub(thisBoid.position);

        centre.normalize();
        centre.multiplyScalar(this.weight);
        return centre;
    }
}
