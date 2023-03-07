import { Rule, RuleArguments } from "./Rule";
import * as THREE from "three";
import { Boid } from "../objects/Boid";

export class AlignmentRule extends Rule {
    readonly name = "Alignment";

    calculateVector(thisBoid: Boid, args: RuleArguments): THREE.Vector3 {
        // no alignment force if there are no visible neighbours
        if (args.neighbours.length === 0) {
            return new THREE.Vector3();
        }

        const alignment = new THREE.Vector3();

        let weightSum = 0;

        for (const neighbour of args.neighbours) {
            let weight = args.simParams.dropoffRule.fn(thisBoid.toOther(neighbour, args.simParams).length());
            alignment.addScaledVector(neighbour.velocity, weight);
            weightSum += weight;
        }
        alignment.divideScalar(weightSum);

        //console.log(alignment)

        alignment.normalize();
        alignment.multiplyScalar(this.weight);

        return alignment;
    }
}
