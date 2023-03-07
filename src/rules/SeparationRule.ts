import { Rule, RuleArguments } from "./Rule";
import * as THREE from "three";
import { Boid } from "../objects/Boid";

export class SeparationRule extends Rule {
    readonly name = "Separation";

    calculateVector(thisBoid: Boid, args: RuleArguments): THREE.Vector3 {
        const separation = new THREE.Vector3();

        if (args.neighbours.length === 0) {
            return new THREE.Vector3();
        }

        let weightSum = 0;

        for (const neighbour of args.neighbours) {
            let weight = args.simParams.dropoffRule.fn(thisBoid.toOther(neighbour, args.simParams).length())
            const diff = new THREE.Vector3();
            diff.subVectors(thisBoid.position, neighbour.position);
            separation.addScaledVector(diff, weight);
            weightSum += weight
        }

        //console.log(weightSum)
        separation.divideScalar(weightSum);

        //console.log(separation)

        separation.normalize();
        separation.multiplyScalar(this.weight);

        return separation;
    }
}
