import type { EnvironmentConfig } from "@/lib/environment-config"

/**
 * Connect to Oracle DB dynamically.
 * ✅ No top-level import of `oracledb` (Turbopack safe)
 */
export async function connectDb(env: EnvironmentConfig) {
  const { db } = env

  const connectionString =
    db.connectionType === "sid"
      ? `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${db.hostname})(PORT=${db.port}))(CONNECT_DATA=(SID=${db.sid})))`
      : `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${db.hostname})(PORT=${db.port}))(CONNECT_DATA=(SERVICE_NAME=${db.serviceName})))`

  // Dynamic import to avoid client-side bundling
  const oracledb = await import("oracledb")
  return oracledb.getConnection({
    user: db.username,
    password: db.password,
    connectString: connectionString,
  })
}
