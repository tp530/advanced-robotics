# 4M25 Advanced Robotics Group Project: Decentralised Multi-Robot Flocking Simulation

## Live demo

A live demo of the app is available [here](https://tp530.github.io/advanced-robotics/).

You can try one of the example links below to load a specific configuration:

- [Obstacles with photorealistic rendering](https://tp530.github.io/advanced-robotics/?worldName=obstacles&rendering=photorealistic)

- [First-person view (i.e., flying with the flock)](https://tp530.github.io/advanced-robotics/?worldName=obstacles&rendering=photorealistic&cameraTracking=flockCenterFpv)

- [Change of Leadership example](https://tp530.github.io/advanced-robotics/?behaviour=leadership)

## Python notebook

The notebook source code is available [here](https://github.com/tp530/advanced-robotics/blob/main/notebooks/notebook.ipynb). You will need your own Python environment to run it.

## Simulator URL parameters

You can add the following keys and values to the URL links to create “one-click” experiences. Example URL: 

`https://tp530.github.io/advanced-robotics/?worldName=obstacles&rendering=photorealistic`

| Parameter | Accepted values | Description |
| --- | --- | --- |
| `worldName` | “default”, “smallWorld” or “obstacles” | The name of the world. |
| `behaviour` | “reynolds” or “leadership” | The algorithmic behaviour of boids. Two further behaviours are available at “alec” and “matei-dev” git branches. |
| `rendering` | “simple” or “photorealistic” | The rendering mode. |
| `cameraTracking` | “none”, “firstBoid”, “firstBoidFpv”, “flockCenter” or “flockCenterFpv” | The camera tracking mode. |
| `boidCount` | An integer value between 10 and 200. | The number of boids in the arena. |
| `maxSpeed` | A floating point number between 0.1 and 2. | The maximum speed of the boids. |
| `visibilityThreshold` | An integer value between 5 and 200. | The visibility threshold of the boids. |
| `randomnessPerTimestep` | A floating point number between 0 and 0.02. | Randomness per timestep. |
| `randomnessLimit` | A floating point number between 0 and 0.5. | Randomness limit. |
| `separation` | A floating point number between 0 and 1.6. | Rule weight: Separation |
| `cohesion` | A floating point number between 0 and 2. | Rule weight: Cohesion |
| `alignment` | A floating point number between 0 and 2. | Rule weight: Alignment |
| `avoidWorldBoundary` | A floating point number between 0 and 20. | Rule weight: World Boundary Avoidance |
| `collisionAvoidance` | A floating point number between 0 and 20. | Rule weight: Collision Avoidance |
| `followLeader` | A floating point number between 0 and 10. | Rule weight: Leader Following |
| `avoidObstacleBoundary` | A floating point number between 0 and 20. | Rule weight: Obstacle Boundary Avoidance. |
| `maxLeaderTimestep` | An integer value between 100 and 400. | Change of Leader: Timesteps |
| `eccentricityThreshold` | A floating point number between 0 and 1. | Change of Leader: Eccentricity |
| `neighbourCountThreshold` | An integer value between 0 and 15. | Randomness limit. |
| `becomeLeaderProbability` | A floating point number between 0 and 0.005. | Change of Leader: Leader |
| `peakSpeedMultiplier` | A floating point number between 1 and 2. | Change of Leader: Escape speed |
| `peakSpeedTimestepFraction` | A floating point number between 0 and 1. | Change of Leader: Speed profile |

## Development

To run the app locally, use:

```shell
npm run dev
```

To build the app locally, use:

```shell
npm run build
```

## Links

[Three.js documentation](https://threejs.org/docs/#manual/en/introduction/Creating-a-scene)