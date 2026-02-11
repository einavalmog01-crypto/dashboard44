export type Environment = "CRs" | "SST" | "DEV3ST" | "DEV4ST" | "DEV5ST" | "DEV360"

export interface DbConfig {
  hostname: string
  port: string
  connectionType: "sid" | "serviceName"
  sid: string
  serviceName: string
  username: string
  password: string
}

export interface AuthConfig {
  username: string
  password: string
}

export interface EndpointConfig {
  host: string
}

export interface UnixConfig {
  hostName: string
  port: string
  userName: string
  password: string
}

export interface EnvironmentConfig {
  name: Environment
  color: string
  db: DbConfig
  auth: AuthConfig
  endpoint: EndpointConfig
  unix: UnixConfig
  isConfigured: boolean
}

export const defaultEnvironments: EnvironmentConfig[] = [
  {
    name: "CRs",
    color: "bg-blue-500",
    isConfigured: false,
    db: {
      hostname: "",
      port: "1521",
      connectionType: "sid",
      sid: "",
      serviceName: "",
      username: "",
      password: "",
    },
    auth: {
      username: "",
      password: "",
    },
    endpoint: {
      host: "",
    },
    unix: {
      hostName: "",
      port: "22",
      userName: "",
      password: "",
    },
  },
  {
    name: "SST",
    color: "bg-green-500",
    isConfigured: false,
    db: {
      hostname: "",
      port: "1521",
      connectionType: "sid",
      sid: "",
      serviceName: "",
      username: "",
      password: "",
    },
    auth: {
      username: "",
      password: "",
    },
    endpoint: {
      host: "",
    },
    unix: {
      hostName: "",
      port: "22",
      userName: "",
      password: "",
    },
  },
  {
    name: "DEV3ST",
    color: "bg-yellow-500",
    isConfigured: false,
    db: {
      hostname: "",
      port: "1521",
      connectionType: "sid",
      sid: "",
      serviceName: "",
      username: "",
      password: "",
    },
    auth: {
      username: "",
      password: "",
    },
    endpoint: {
      host: "",
    },
    unix: {
      hostName: "",
      port: "22",
      userName: "",
      password: "",
    },
  },
  {
    name: "DEV4ST",
    color: "bg-red-500",
    isConfigured: false,
    db: {
      hostname: "",
      port: "1521",
      connectionType: "sid",
      sid: "",
      serviceName: "",
      username: "",
      password: "",
    },
    auth: {
      username: "",
      password: "",
    },
    endpoint: {
      host: "",
    },
    unix: {
      hostName: "",
      port: "22",
      userName: "",
      password: "",
    },
  },
 {
    name: "DEV5ST",
    color: "bg-red-500",
    isConfigured: false,
    db: {
      hostname: "",
      port: "1521",
      connectionType: "sid",
      sid: "",
      serviceName: "",
      username: "",
      password: "",
    },
    auth: {
      username: "",
      password: "",
    },
    endpoint: {
      host: "",
    },
    unix: {
      hostName: "",
      port: "22",
      userName: "",
      password: "",
    },
  },
 {
    name: "DEV360",
    color: "bg-red-500",
    isConfigured: false,
    db: {
      hostname: "",
      port: "1521",
      connectionType: "sid",
      sid: "",
      serviceName: "",
      username: "",
      password: "",
    },
    auth: {
      username: "",
      password: "",
    },
    endpoint: {
      host: "",
    },
    unix: {
      hostName: "",
      port: "22",
      userName: "",
      password: "",
    },
  },

]

export function isEnvironmentConfigured(env: EnvironmentConfig) {
  return (
    !!env.db.hostname &&
    !!env.db.username &&
    !!env.db.password &&
    (!!env.db.sid || !!env.db.serviceName) &&
    !!env.auth.username &&
    !!env.auth.password &&
    !!env.endpoint.host &&
    !!env.unix.hostName &&
    !!env.unix.userName &&
    !!env.unix.password
  )
}
