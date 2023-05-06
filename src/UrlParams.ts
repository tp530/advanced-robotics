import { BoidType } from "./BoidGenerator";
import { BoidBehaviour, BoidSimulation, BoidSimulationParams, CameraTrackingModes, RecordingModes, RenderingModes } from "./BoidSimulation";
import { WorldTools } from "./objects/world/WorldTools";
import { defaultWorld } from "./worlds/Default";

export class UrlParams {

    private static getDefaultValues(): BoidSimulationParams {
        return {
            behaviour: BoidBehaviour.Reynolds,
            boidCount: 50,
            boidType: BoidType.Normal,
            recording: RecordingModes.None,
            visibilityThreshold: 50,
            maxSpeed: 0.5,
            acceleration: 0.01,
            worldName: defaultWorld.name,
            worldDimens: WorldTools.getWorldByName(BoidSimulation.worlds, defaultWorld.name).get3DBoundaries(),
            rendering: RenderingModes.Simple,
            cameraTracking: CameraTrackingModes.None,
            randomnessPerTimestep: 0.01,
            randomnessLimit: 0.1,
            changeOfLeaderBoidOptions: {
                maxLeaderTimestep: 200,
                eccentricityThreshold: 0.5,
                neighbourCountThreshold: 8,
                becomeLeaderProbability: 0.001,
                colourBoids: true,
                peakSpeedMultiplier: 1.25,
                peakSpeedTimestepFraction: 0.25
            }
        }
    }

    public static get(): BoidSimulationParams {

        let params = UrlParams.getDefaultValues();

        // World
        params.worldName = UrlParams.getFromArray("worldName", BoidSimulation.worldNames) ?? defaultWorld.name;
        params.worldDimens = WorldTools.getWorldByName(BoidSimulation.worlds, params.worldName).get3DBoundaries();

        // Behaviour
        const behaviour = new Map<string, string>();
        behaviour.set("reynolds", BoidBehaviour.Reynolds);
        behaviour.set("leadership", BoidBehaviour.ChangeOfLeadership);
        params.behaviour = UrlParams.getFromMap<BoidBehaviour>("behaviour", behaviour) ?? params.behaviour;

        // Rendering
        const rendering = new Map<string, string>();
        rendering.set("simple", RenderingModes.Simple);
        rendering.set("photorealistic", RenderingModes.Photorealistic);
        params.rendering = UrlParams.getFromMap<RenderingModes>("rendering", rendering) ?? params.rendering;   

        // Camera tracking
        const tracking = new Map<string, string>();
        tracking.set("none", CameraTrackingModes.None);
        tracking.set("firstBoid", CameraTrackingModes.FirstBoid);
        tracking.set("firstBoidFpv", CameraTrackingModes.FirstBoidFPV);
        tracking.set("flockCenter", CameraTrackingModes.FlockCenter);
        tracking.set("flockCenterFpv", CameraTrackingModes.FlockCenterFPV);
        params.cameraTracking = UrlParams.getFromMap<CameraTrackingModes>("cameraTracking", tracking) ?? params.cameraTracking;   

        // Boid count
        params.boidCount = UrlParams.getInt("boidCount", 10, 200) ?? params.boidCount;

        // Max speed
        params.maxSpeed = UrlParams.getFloat("maxSpeed", 0.1, 2, 2) ?? params.maxSpeed;

        // Visibility radius
        params.visibilityThreshold = UrlParams.getInt("visibilityThreshold", 5, 200) ?? params.visibilityThreshold;

        // Randomness per timestep
        params.randomnessPerTimestep = UrlParams.getFloat("randomnessPerTimestep", 0, 0.02, 3) ?? params.randomnessPerTimestep;

        // Randomness limit
        params.randomnessLimit = UrlParams.getFloat("randomnessLimit", 0, 0.5, 2) ?? params.randomnessLimit;

        // Rule weights
        for (const rule of BoidSimulation.rules) {
            const weight = UrlParams.getFloat(UrlParams.normalizeRuleName(rule.name), rule.minWeight, rule.maxWeight, 1);
            if (weight !== undefined) {
                rule.weight = weight;
            }
        }

        // Change of Leader: Timesteps        
        params.changeOfLeaderBoidOptions.maxLeaderTimestep = UrlParams.getInt("maxLeaderTimestep", 100, 400) ?? params.changeOfLeaderBoidOptions.maxLeaderTimestep;

        // Change of Leader: Eccentricity        
        params.changeOfLeaderBoidOptions.eccentricityThreshold = UrlParams.getFloat("eccentricityThreshold", 0, 1, 2) ?? params.changeOfLeaderBoidOptions.eccentricityThreshold;

        // Change of Leader: Min neighbours
        params.changeOfLeaderBoidOptions.neighbourCountThreshold = UrlParams.getInt("neighbourCountThreshold", 0, 15) ?? params.changeOfLeaderBoidOptions.neighbourCountThreshold;

        // Change of Leader: Leader        
        params.changeOfLeaderBoidOptions.becomeLeaderProbability = UrlParams.getFloat("becomeLeaderProbability", 0, 0.005, 4) ?? params.changeOfLeaderBoidOptions.becomeLeaderProbability;

        // Change of Leader: Escape speed
        params.changeOfLeaderBoidOptions.peakSpeedMultiplier = UrlParams.getFloat("peakSpeedMultiplier", 1, 2, 2) ?? params.changeOfLeaderBoidOptions.peakSpeedMultiplier;

        // Change of Leader: Speed profile
        params.changeOfLeaderBoidOptions.peakSpeedTimestepFraction = UrlParams.getFloat("peakSpeedTimestepFraction", 0, 1, 2) ?? params.changeOfLeaderBoidOptions.peakSpeedTimestepFraction;

        return params;
    }

    private static getInt(paramName: string, min: number, max: number): number | undefined {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(paramName)) {
            let result: string | null = urlParams.get(paramName);
            if (result !== null) {
                let parsed = parseInt(result);
                if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
                    return parsed;
                }
            }
        }
        return undefined;
    }

    private static getFloat(paramName: string, min: number, max: number, decimalPlaces: number): number | undefined {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(paramName)) {
            let result: string | null = urlParams.get(paramName);
            if (result !== null) {
                let parsed = parseFloat(parseFloat(result).toFixed(decimalPlaces));
                if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
                    return parsed;
                }
            }
        }
        return undefined;
    }

    private static getFromMap<T>(paramName: string, map: Map<string, string>): T | undefined {
        if (map.size === 0) {
            throw new Error("The provided map is empty.");
        }
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(paramName)) {
            let key: string | null = urlParams.get(paramName);
            if (key !== null) {
                return map.get(key) as T;
            }
        }
        return undefined;
    }

    private static getFromArray(paramName: string, array: string[]): string | undefined {
        if (array.length === 0) {
            throw new Error("The provided array is empty.");
        }
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(paramName)) {
            let value: string | null = urlParams.get(paramName);
            if (value !== null && array.includes(value)) {
                return value;
            }
        }
        return undefined;
    }

    private static normalizeRuleName(ruleName: string): string {
        ruleName = ruleName.toLowerCase();
        for (let i = 97; i <= 122; i++) {
            ruleName = ruleName.replaceAll(" " + String.fromCharCode(i), String.fromCharCode(i-32));
        }
        return ruleName;
    }

}
