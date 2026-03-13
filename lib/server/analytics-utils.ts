export const calculateSelfConsumption = (generation: number, exportEnergy: number) => {
  if (generation <= 0) return 0
  const selfConsumed = Math.max(generation - exportEnergy, 0)
  return (selfConsumed / generation) * 100
}

export const calculateSelfSufficiency = (consumption: number, importEnergy: number) => {
  if (consumption <= 0) return 0
  return ((consumption - importEnergy) / consumption) * 100
}

export const calculatePerformanceRatio = (generation: number, expectedGeneration: number) => {
  if (expectedGeneration <= 0) return 0
  return (generation / expectedGeneration) * 100
}

export const detectGenerationAnomaly = (actualGeneration: number, expectedGeneration: number) => {
  if (expectedGeneration <= 0) return false
  return actualGeneration < expectedGeneration * 0.8
}
