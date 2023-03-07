import { Boid, BoidId } from "./Boid";
import { Rule, RuleArguments } from "../rules/Rule";
import * as THREE from "three";
import { Bounds3D } from "../Bounds3D";

export enum LeaderBoidStatus {
    Leader,
    NotLeader,
}

export class ChangeOfLeaderBoid extends Boid {
    status = LeaderBoidStatus.NotLeader;
    private leaderTimestep = 0;
    private static readonly MAX_LEADER_TIMESTEP = 200;
    private static readonly ECCENTRICITY_THRESHOLD = 0.5;
    private static readonly NEIGHBOUR_COUNT_THRESHOLD = 8;

    followingBoid: BoidId | null = null;

    updateAndMove(rules: Rule[], ruleArguments: RuleArguments) {
        // stop being a leader after some time
        if (
            this.status === LeaderBoidStatus.Leader &&
            this.leaderTimestep > ChangeOfLeaderBoid.MAX_LEADER_TIMESTEP
        ) {
            this.status = LeaderBoidStatus.NotLeader;
        }
        switch (this.status) {
            case LeaderBoidStatus.Leader: {
                this.leaderTimestep++;
                this.updateLeader();
                (this.mesh.material as THREE.MeshBasicMaterial).color = new THREE.Color().setHSL(
                    0.2,
                    1,
                    0.5,
                );

                // TODO make sure to still run collision avoidance rules -- maybe add a "rule type"
                break;
            }
            case LeaderBoidStatus.NotLeader: {
                this.updateNotLeader(rules, ruleArguments);
                this.allowChanceToBecomeLeader(ruleArguments);
                if (this.followingBoid !== null) {
                    (this.mesh.material as THREE.MeshBasicMaterial).color =
                        new THREE.Color().setHSL(0, 0.8, 0.5);
                }
                break;
            }
        }
    }

    private updateLeader() {
        super.move();
    }

    private updateNotLeader(rules: Rule[], ruleArguments: RuleArguments) {
        super.updateAndMove(rules, ruleArguments);
    }

    private allowChanceToBecomeLeader(ruleArguments: RuleArguments) {
        const x = this.calculateEccentricity(
            ruleArguments.neighbours,
            ruleArguments.simParams.visibilityThreshold,
        );
        let hasChanceOfEscaping = false;
        if (
            x > ChangeOfLeaderBoid.ECCENTRICITY_THRESHOLD &&
            ruleArguments.neighbours.length >= ChangeOfLeaderBoid.NEIGHBOUR_COUNT_THRESHOLD
        ) {
            hasChanceOfEscaping = true;
        }
        (this.mesh.material as THREE.MeshBasicMaterial).color = new THREE.Color().setHSL(
            0.7,
            1,
            hasChanceOfEscaping ? 0.7 : 0.1,
        );

        if (hasChanceOfEscaping) {
            const isEscaping = Math.random() > 0.99;
            if (isEscaping) {
                this.status = LeaderBoidStatus.Leader;
            }
        }
    }

    private calculateEccentricity(neighbours: Boid[], visibilityRadius: number): number {
        if (neighbours.length === 0) {
            return 0;
        }
        // calculate centre of visible boids (like in cohesion rule)
        const centre = this.calculateCentreOfVisibleBoids(neighbours);

        // divide by visibility radius to normalise the eccentricity in [0, 1]
        return this.position.distanceTo(centre) / visibilityRadius;
    }

    private calculateCentreOfVisibleBoids(neighbours: Boid[]): THREE.Vector3 {
        if (neighbours.length === 0) {
            return new THREE.Vector3();
        }
        const centre = new THREE.Vector3();
        for (const neighbour of neighbours) {
            centre.add(neighbour.position);
        }
        centre.divideScalar(neighbours.length);
        return centre;
    }

    /**
     * Factory method to generate a boid with random position and velocity.
     * Options can be passed to control the min/max bounds for the random generation.
     * For any bounds that aren't passed, sensible defaults are used.
     */
    static generateWithRandomPosAndVel(
        id: BoidId,
        options?: {
            positionBounds?: Bounds3D;
            velocityBounds?: Bounds3D;
        },
    ): Boid {
        // default position and velocity bounds
        const minXPos = options?.positionBounds?.xMin ?? -100;
        const maxXPos = options?.positionBounds?.xMax ?? 100;
        const minYPos = options?.positionBounds?.yMin ?? 0;
        const maxYPos = options?.positionBounds?.yMax ?? 50;
        const minZPos = options?.positionBounds?.zMin ?? -100;
        const maxZPos = options?.positionBounds?.zMax ?? 100;

        const minXVel = options?.velocityBounds?.xMin ?? -0.2;
        const maxXVel = options?.velocityBounds?.xMax ?? 0.2;
        const minYVel = options?.velocityBounds?.yMin ?? -0.02;
        const maxYVel = options?.velocityBounds?.yMax ?? 0.02;
        const minZVel = options?.velocityBounds?.zMin ?? -0.2;
        const maxZVel = options?.velocityBounds?.zMax ?? 0.2;

        return new ChangeOfLeaderBoid(id, {
            position: new THREE.Vector3(
                Math.random() * (maxXPos - minXPos) + minXPos,
                Math.random() * (maxYPos - minYPos) + minYPos,
                Math.random() * (maxZPos - minZPos) + minZPos,
            ),
            velocity: new THREE.Vector3(
                Math.random() * (maxXVel - minXVel) + minXVel,
                Math.random() * (maxYVel - minYVel) + minYVel,
                Math.random() * (maxZVel - minZVel) + minZVel,
            ),
        });
    }
}
