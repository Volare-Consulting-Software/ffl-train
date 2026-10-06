/** Inputs that make a simulation repeatable: the random source and how many seasons to play out. */
export interface SimulationOptions {
  iterations: number;
  random: () => number;
}
