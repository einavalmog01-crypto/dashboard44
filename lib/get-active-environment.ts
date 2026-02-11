import {
  type EnvironmentConfig,
  type Environment,
  defaultEnvironments,
} from "@/lib/environment-config"

/**
 * Returns the EnvironmentConfig for a given environment name.
 * Used server-side in API routes to resolve environment connection details.
 */
export function getActiveEnvironment(envName: string): EnvironmentConfig {
  const env = defaultEnvironments.find(
    (e) => e.name.toLowerCase() === envName.toLowerCase()
  )

  if (!env) {
    throw new Error(
      `Environment "${envName}" not found. Available: ${defaultEnvironments
        .map((e) => e.name)
        .join(", ")}`
    )
  }

  return env
}
