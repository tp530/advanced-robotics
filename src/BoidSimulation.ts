import { Simulation } from "./Simulation";
import { Boid, BoidId } from "./objects/Boid";
import { GUI } from "dat.gui";
import { Floor } from "./objects/Floor";
import { SeparationRule } from "./rules/SeparationRule";
import { CohesionRule } from "./rules/CohesionRule";
import { AlignmentRule } from "./rules/AlignmentRule";
import { WorldBoundaryRule } from "./rules/WorldBoundaryRule";
import { CollisionAvoidanceRule } from "./rules/CollisionAvoidanceRule";
import { Arena } from "./objects/Arena";
import { ChangeOfLeaderBoidOptions } from "./objects/ChangeOfLeaderBoid";
import { Water } from "./objects/Water";
import { Sky } from "./objects/Sky";
import * as THREE from "three";
import { SunParams } from "./objects/Sun";
import { ShaderMaterial } from "three";
import { World } from "./objects/world/World";
import { defaultWorld } from "./worlds/Default";
import { smallWorld } from "./worlds/SmallWorld";
import { Bounds3D } from "./Bounds3D";
import { WorldTools } from "./objects/world/WorldTools";
import { FollowLeaderRule } from "./rules/FollowLeaderRule";
import { BoidGenerator, BoidType } from "./BoidGenerator";
import { obstacles1 } from "./worlds/Obstacles1";
import { Cylinder } from "./objects/Cylinder";
import { ObstacleAvoidanceRule } from "./rules/ObstacleAvoidanceRule";
import { Rule } from "./rules/Rule";
import FileSaver from 'file-saver';
import { UrlParams } from "./UrlParams";

export interface BoidSimulationParams {
    behaviour: BoidBehaviour;
    boidCount: number;
    boidType: BoidType;
    visibilityThreshold: number;
    maxSpeed: number;
    acceleration: number;
    worldName: string;
    worldDimens: Bounds3D;
    rendering: RenderingModes;
    cameraTracking: CameraTrackingModes;
    randomnessPerTimestep: number;
    randomnessLimit: number;
    changeOfLeaderBoidOptions: ChangeOfLeaderBoidOptions;
}

export enum BoidBehaviour {
    Reynolds = "Reynolds’ Algorithm",
    ChangeOfLeadership = "Change of Leadership"
}

export enum RenderingModes {
    Simple = "Simple",
    Photorealistic = "Photorealistic"
}

export enum CameraTrackingModes {
    None = "None",
    FirstBoid = "First Boid",
    FirstBoidFPV = "First Boid FPV",
    FlockCenter = "Flock Centre",
    FlockCenterFPV = "Flock Centre FPV"
}

export class BoidSimulation extends Simulation {
    controlsGui: GUI;
    changeOfLeaderGui?: GUI;

    public static worlds: World[] = [
        defaultWorld, smallWorld, obstacles1
    ];

    public static worldNames: string[] = WorldTools.getNames(BoidSimulation.worlds);

    behaviourNames: string[] = Object.values(BoidBehaviour);

    public static currentWorldName: string = defaultWorld.name;
    currentRendering: string = RenderingModes.Simple;
    currentBehaviour: string = BoidBehaviour.Reynolds;

    boids: Boid[] = [];
    private nextBoidId: BoidId = 0;

    simParams: BoidSimulationParams = UrlParams.get();

    boidSteps: string[] = [];
    recordSteps: boolean = false;

    // initial world will get set in constructor by calling reloadWorld
    private static obstacleAvoidRule = new ObstacleAvoidanceRule(10, {world: defaultWorld});

    public static rules: Rule[] = [
        new SeparationRule(0.8),
        new CohesionRule(1),
        new AlignmentRule(1),
        new WorldBoundaryRule(10),
        new CollisionAvoidanceRule(10),
        new FollowLeaderRule(5),
        this.obstacleAvoidRule
    ];

    private floor?: Floor;
    private arena?: Arena;
    private water?: Water;
    private sky?: Sky;
    private sun?: THREE.Vector3;
    private generator?: THREE.PMREMGenerator;
    private renderTarget?: THREE.WebGLRenderTarget;

    constructor(params?: BoidSimulationParams) {
        super();

        if (params) {
            this.simParams = params;
        }

        // Init controls GUI
        this.controlsGui = new GUI({
            hideable: false,
        });

        this.controlsGui.add(this.simParams, "worldName", BoidSimulation.worldNames).name("World");
        this.controlsGui.add(this.simParams, "behaviour", this.behaviourNames).name("Behaviour");
        this.controlsGui.add(this.simParams, "rendering", this.getRenderingModeNames()).name("Rendering");
        this.controlsGui.add(this.simParams, "cameraTracking", this.getCameraTrackingModeNames()).name("Tracking");
        this.controlsGui.add(this.simParams, "boidCount", 10, 200).name("Boid count");
        this.controlsGui.add(this.simParams, "maxSpeed", 0.1, 2, 0.01).name("Max speed");
        this.controlsGui
            .add(this.simParams, "visibilityThreshold", 5, 100)
            .name("Visibility radius");

        // Controls to change level of randomness
        const randomnessGui = this.controlsGui.addFolder("Randomness");
        randomnessGui.open();
        randomnessGui
            .add(this.simParams, "randomnessPerTimestep", 0, 0.02, 0.001)
            .name("Per timestep");
        randomnessGui.add(this.simParams, "randomnessLimit", 0, 0.5, 0.01).name("Limit");

        // Controls to change rule weights
        const ruleWeightsGui = this.controlsGui.addFolder("Rule weights");
        ruleWeightsGui.open();
        for (const rule of BoidSimulation.rules) {
            ruleWeightsGui.add(rule, "weight", rule.minWeight, rule.maxWeight, 0.1).name(rule.name);
        }

        // Controls for Change of Leader behaviour
        if (this.simParams.behaviour === BoidBehaviour.ChangeOfLeadership) {
            this.addChangeOfLeaderGui();
        }

        this.reloadWorld();
    }

    addChangeOfLeaderGui(): void {
        this.changeOfLeaderGui = this.controlsGui.addFolder("Change of Leader");
        this.changeOfLeaderGui.open();
        this.changeOfLeaderGui
            .add(this.simParams.changeOfLeaderBoidOptions, "maxLeaderTimestep", 100, 400, 20)
            .name("Timesteps");
        this.changeOfLeaderGui
            .add(this.simParams.changeOfLeaderBoidOptions, "eccentricityThreshold", 0, 1, 0.05)
            .name("Eccentricity threshold");
        this.changeOfLeaderGui
            .add(this.simParams.changeOfLeaderBoidOptions, "neighbourCountThreshold", 0, 15, 1)
            .name("Min neighbours");
        this.changeOfLeaderGui
            .add(
                this.simParams.changeOfLeaderBoidOptions,
                "becomeLeaderProbability",
                0,
                0.005,
                0.0001,
            )
            .name("Leader probability");
        this.changeOfLeaderGui
            .add(this.simParams.changeOfLeaderBoidOptions, "peakSpeedMultiplier", 1, 2, 0.05)
            .name("Escape speed");
        this.changeOfLeaderGui
            .add(this.simParams.changeOfLeaderBoidOptions, "peakSpeedTimestepFraction", 0, 1, 0.05)
            .name("Speed profile");
    }

    getRenderingModeNames(): string[] {
        return Object.values(RenderingModes);
    }

    getCameraTrackingModeNames(): string[] {
        return Object.values(CameraTrackingModes);
    }

    initializePhotorealisticRendering() {
        // Sun
        this.sun = new THREE.Vector3();

        // Water
        const waterGeometry = new THREE.PlaneGeometry(10_000, 10_000);

        this.water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(
                "textures/waternormals.jpg",
                function (texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                },
            ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: true,
        });

        this.water.rotation.x = -Math.PI / 2;
        this.addToScene(this.water);

        // Sky
        this.sky = new Sky();
        this.sky.scale.setScalar(10_000);
        this.addToScene(this.sky);

        if (this.sky.material instanceof ShaderMaterial) {
            const skyUniforms = this.sky.material.uniforms;
            skyUniforms["turbidity"].value = 10;
            skyUniforms["rayleigh"].value = 2;
            skyUniforms["mieCoefficient"].value = 0.005;
            skyUniforms["mieDirectionalG"].value = 0.8;
        }

        this.generator = new THREE.PMREMGenerator(this.renderer);
        this.updateSun();
    }

    updateSun() {
        if (this.simParams.rendering !== RenderingModes.Photorealistic)
            throw new Error("Photorealistic rendering is disabled.");
        if (
            this.sun === undefined ||
            this.sky === undefined ||
            this.water === undefined ||
            this.generator === undefined
        ) {
            throw new Error("One or more photorealistic rendering variables are undefined.");
        }

        const phi = THREE.MathUtils.degToRad(90 - SunParams.elevation);
        const theta = THREE.MathUtils.degToRad(SunParams.azimuth);

        this.sun.setFromSphericalCoords(1, phi, theta);

        if (this.sky.material instanceof ShaderMaterial) {
            this.sky.material.uniforms["sunPosition"].value.copy(this.sun);
        }

        if (this.water.material instanceof ShaderMaterial) {
            this.water.material.uniforms["sunDirection"].value.copy(this.sun).normalize();
        }

        if (this.renderTarget !== undefined) {
            this.renderTarget.dispose();
        }

        this.renderTarget = this.generator.fromScene(this.scene);
        this.scene.environment = this.renderTarget.texture;
    }

    updateGUI(): void {

        if (this.currentBehaviour !== this.simParams.behaviour) {
            switch (this.simParams.behaviour) {
                case BoidBehaviour.Reynolds:
                    if (this.changeOfLeaderGui !== undefined) {
                        this.controlsGui.removeFolder(this.changeOfLeaderGui);
                        this.changeOfLeaderGui = undefined;
                    }
                    break;
                case BoidBehaviour.ChangeOfLeadership:
                    if (this.changeOfLeaderGui === undefined) {
                        this.addChangeOfLeaderGui();
                    }
                    break;
            }
            this.currentBehaviour = this.simParams.behaviour;
        }
    }

    update(): void {

        // Reload the world if needed
        if (BoidSimulation.currentWorldName !== this.simParams.worldName ||
            this.currentBehaviour!== this.simParams.behaviour ||
            this.currentRendering !== this.simParams.rendering) {
            this.reloadWorld();
            this.updateGUI();
        }

        // update boids before updating base simulation to rerender
        this.updateBoidCount();

        this.boids.map((boid) =>
            boid.update(BoidSimulation.rules, {
                neighbours: this.getBoidNeighbours(boid),
                simParams: this.simParams,
            }),
        );

        if (
            this.simParams.rendering === RenderingModes.Photorealistic &&
            this.water !== undefined &&
            this.water.material instanceof ShaderMaterial
        ) {
            this.water.material.uniforms["time"].value += 1.0 / 60.0;
        }

        switch (this.simParams.cameraTracking) {
            case CameraTrackingModes.FlockCenter:
            this.controls.target = this.getFlockCenter();
                break;
            case CameraTrackingModes.FirstBoid:
                if (this.boids.length > 0) {
                    this.controls.target = this.boids[0].position;
                }
                break;
            case CameraTrackingModes.FirstBoidFPV:
                if (this.boids.length > 0) {
                    this.camera.position.set(
                        this.boids[0].position.x,
                        this.boids[0].position.y,
                        this.boids[0].position.z
                    );
                    this.controls.target = this.boids[0].position.clone().add(this.boids[0].actualVelocity);
                }
                break;
                case CameraTrackingModes.FlockCenterFPV:
                    if (this.boids.length > 0) {
                        const center = this.getFlockCenter();
                        this.camera.position.set(
                            center.x,
                            center.y,
                            center.z
                        );
                        this.controls.target = this.camera.position.clone().add(this.getFlockTarget());
                    }
                break;
        }

        super.update();

        if (this.recordSteps) {
            this.recordBoidStep();
            if (this.boidSteps.length === 60 * 10) {
                this.recordSteps = false;
                let blob = new Blob([this.boidSteps.join("\n")], {type: "text/plain;charset=utf-8"});
                FileSaver.saveAs(blob, "boid_flight_paths.csv");
                this.boidSteps = [];
            }
        }

    }

    recordBoidStep(): void {
        let currentPositions: number[] = [];
        for (let boid of this.boids) {
            let pos = boid.position;
            currentPositions.push(pos.x);
            currentPositions.push(pos.y);
            currentPositions.push(pos.z);
        }
        this.boidSteps.push(currentPositions.join(','));
    }

    getFlockTarget(): THREE.Vector3 {
        if (this.boids.length === 0) {
            return new THREE.Vector3();
        }
        const alignment = new THREE.Vector3();

        for (const neighbour of this.boids) {
            alignment.add(neighbour.actualVelocity);
        }
        alignment.divideScalar(this.boids.length);
        return alignment;
    }

    getFlockCenter(): THREE.Vector3 {
        if (this.boids.length === 0) {
            return new THREE.Vector3();
        } 
        let sumX = 0;
        let sumY = 0;
        let sumZ = 0;
        for (const boid of this.boids) {
            sumX += boid.position.x;
            sumY += boid.position.y;
            sumZ += boid.position.z;
        }
        return new THREE.Vector3(sumX/this.boids.length, sumY/this.boids.length, sumZ/this.boids.length);
    }

    reloadWorld() {
        const world = WorldTools.getWorldByName(BoidSimulation.worlds, this.simParams.worldName);
        this.simParams.worldDimens = world.get3DBoundaries();

        this.clearScene();

        BoidSimulation.obstacleAvoidRule.setWorld(world);

        // Remove old boids
        this.boids = [];

        // Delete recorded steps
        this.boidSteps = [];

        // Arena
        this.arena = new Arena(this.simParams);
        this.addToScene(this.arena.mesh);

        if (this.simParams.rendering === RenderingModes.Photorealistic) {
            this.initializePhotorealisticRendering();
        } else {
            // Floor
            this.floor = new Floor(this.simParams);
            this.addToScene(this.floor.mesh);
        }

        // Obstacles
        for (const description of world.obstacles.cylinders) {
            const cylinder = new Cylinder({
                description: description, 
                rendering: RenderingModes.Photorealistic
            });
            this.addToScene(cylinder.mesh);
        }

        BoidSimulation.currentWorldName = this.simParams.worldName;
        this.currentRendering = this.simParams.rendering;

    }

    updateBoidCount() {
        if (this.simParams.boidCount === this.boids.length) {
            return;
        }
        // Calculate how many boids we need to generate/remove.
        // Do this here so we don't evaluate boids.length on every loop iteration.
        let difference = this.simParams.boidCount - this.boids.length;
        while (difference > 0) {
            // generate new boids
            const boid = BoidGenerator.generateBoidWithRandomPosAndVec(this.newBoidId(), {
                boidType: this.simParams.boidType,
                positionBounds: this.simParams.worldDimens,
                acceleration: this.simParams.acceleration,
                rendering: this.simParams.rendering
            });
            this.addToScene(boid.mesh);
            this.boids.push(boid);
            difference--;
        }
        while (difference < 0) {
            // remove boids
            const boid = this.boids.pop();
            if (boid === undefined) {
                // handle the case that for some reason there's no boid to remove
                break;
            }
            this.removeFromScene(boid.mesh);
            difference++;
        }
    }

    private newBoidId(): BoidId {
        const id = this.nextBoidId;
        this.nextBoidId++;
        return id;
    }

    getBoidNeighbours(boid: Boid): Boid[] {
        const neighbours = [];
        for (const otherBoid of this.boids) {
            if (otherBoid === boid) {
                continue;
            }
            if (boid.isOtherBoidVisible(otherBoid, this.simParams.visibilityThreshold)) {
                neighbours.push(otherBoid);
            }
        }
        return neighbours;
    }
}
