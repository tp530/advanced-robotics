import { Boid, BoidId, BoidOptions } from "./Boid";
import { Rule, RuleArguments } from "../rules/Rule";
import * as THREE from "three";
import { Bounds3D } from "../Bounds3D";
import { CohesionRule } from "../rules/CohesionRule";

export enum LeaderBoidStatus {
    Leader,
    NotLeader,
}

export interface ChangeOfLeaderBoidOptions extends BoidOptions {
    // The max number of timesteps a boid can be a leader for
    maxLeaderTimestep?: number;
    // The level of 'eccentricity' needed for a boid to be allowed to become a
    // leader. (Ie. how much on the outside of the flock it needs to be)
    eccentricityThreshold?: number;
    // The number of neighbours a boid needs to be able to become a leader.
    // This is to prevent shoot-offs from tiny groups of boids.
    neighbourCountThreshold?: number;
    // The probability that a boid will become a leader in a given timestep, given
    // it meets all the other constraints.
    becomeLeaderProbability?: number;
    // Whether to set the boids' colour based on their state
    colourBoids?: boolean;
}

export class ChangeOfLeaderBoid extends Boid {
    status = LeaderBoidStatus.NotLeader;
    private leaderTimestep = 0;
    private maxLeaderTimestep: number;
    private eccentricityThreshold: number;
    private neighbourCountThreshold: number;
    private becomeLeaderProbability: number;

    private readonly COLOUR_BOIDS: boolean;

    followingBoid: BoidId | null = null;

    constructor(id: BoidId, options: ChangeOfLeaderBoidOptions) {
        super(id, options);
        this.maxLeaderTimestep = options?.maxLeaderTimestep ?? 250;
        this.eccentricityThreshold = options?.eccentricityThreshold ?? 0.5;
        this.neighbourCountThreshold = options?.neighbourCountThreshold ?? 8;
        this.becomeLeaderProbability = options?.becomeLeaderProbability ?? 0.001;
        this.COLOUR_BOIDS = options?.colourBoids ?? true;
    }

    update(rules: Rule[], ruleArguments: RuleArguments) {
        // stop being a leader after some time
        if (this.status === LeaderBoidStatus.Leader) {
            this.checkIfStopBeingLeader();
        }
        switch (this.status) {
            case LeaderBoidStatus.Leader: {
                this.leaderTimestep++;
                this.updateLeader(rules, ruleArguments);
                if (this.COLOUR_BOIDS) {
                    this.setColour(new THREE.Color().setHSL(0.2, 1, 0.5));
                }
                break;
            }
            case LeaderBoidStatus.NotLeader: {
                this.updateNotLeader(rules, ruleArguments);
                this.allowChanceToBecomeLeader(ruleArguments);
                // set colour of boid if we're following a leader
                if (this.followingBoid !== null && this.COLOUR_BOIDS) {
                    this.setColour(new THREE.Color().setHSL(0, 0.8, 0.5));
                }
                break;
            }
        }
    }

    private updateLeader(rules: Rule[], ruleArguments: RuleArguments) {
        const antiCohesionRule = new CohesionRule(-10);
        this.targetVelocity.add(antiCohesionRule.calculateVector(this, ruleArguments));

        for (const rule of rules) {
            if (rule.alwaysApplyToLeaderBoids) {
                this.targetVelocity.add(rule.calculateVector(this, ruleArguments));
            }
        }

        this.capSpeed(ruleArguments.simParams.maxSpeed * this.getLeaderMaxSpeedMultiplier());

        // add more randomness to leader boids
        const randomnessMultiplier = 4;
        this.addRandomnessToVelocity(
            ruleArguments.simParams.randomnessPerTimestep * randomnessMultiplier,
            ruleArguments.simParams.randomnessLimit * randomnessMultiplier,
        );

        super.move();
    }

    private updateNotLeader(rules: Rule[], ruleArguments: RuleArguments) {
        super.update(rules, ruleArguments);
    }

    private checkIfStopBeingLeader() {
        // add some randomness around maxLeaderTimestep
        if (
            this.leaderTimestep >
            this.maxLeaderTimestep - (Math.random() * this.maxLeaderTimestep) / 3
        ) {
            this.status = LeaderBoidStatus.NotLeader;
        }
    }

    private allowChanceToBecomeLeader(ruleArguments: RuleArguments) {
        const x = this.calculateEccentricity(
            ruleArguments.neighbours,
            ruleArguments.simParams.visibilityThreshold,
        );
        let hasChanceOfEscaping = false;
        if (
            x > this.eccentricityThreshold &&
            ruleArguments.neighbours.length >= this.neighbourCountThreshold
        ) {
            hasChanceOfEscaping = true;
        }
        // colour boids on the edge of the flock that have a chance of escaping,
        // and all other boids default colour
        if (this.COLOUR_BOIDS) {
            this.setColour(new THREE.Color().setHSL(0.7, 1, hasChanceOfEscaping ? 0.7 : 0.1));
        }

        if (hasChanceOfEscaping) {
            const isEscaping = Math.random() > 1 - this.becomeLeaderProbability;
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

    private getLeaderMaxSpeedMultiplier(): number {
        // allow a short burst of speed at the start of escaping
        if (this.leaderTimestep < this.maxLeaderTimestep / 4) {
            return 1 + (2 * this.leaderTimestep) / this.maxLeaderTimestep;
        } else {
            return 5 / 3 - (2 * this.leaderTimestep) / (3 * this.maxLeaderTimestep);
        }
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
            acceleration?: number;
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

        const acceleration = options?.acceleration ?? 0.01;

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
            acceleration,
        });
    }
}
