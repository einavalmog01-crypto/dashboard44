import type { EnvironmentConfig } from "@/lib/environment-config"
export function getAuthHeaders(env: EnvironmentConfig) {
  const token = Buffer.from(
    `${env.auth.username}:${env.auth.password}`
  ).toString("base64")
return {
    Authorization: `Basic ${token}`,
  }
}
