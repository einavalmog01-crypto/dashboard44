import { getActiveEnvironment } from "@/lib/get-active-environment"
import { validateEnvironment } from "@/lib/validate-environment"
import { getAuthHeaders } from "@/lib/env-auth"
import { connectDb } from "@/lib/db/connect-db"
import { runSshCommand } from "@/lib/ssh/run-ssh-command.server"


// POST /api/run/[type]
export async function POST(req: Request) {
  const selectedEnv = req.headers.get("x-env")
  if (!selectedEnv) {
    return new Response("Missing environment", { status: 400 })
  }

  let env
  try {
    env = getActiveEnvironment(selectedEnv)
  } catch (err) {
    return new Response(`Environment "${selectedEnv}" not found`, { status: 400 })
  }

  // Validate environment config
  try {
    validateEnvironment(env)
  } catch (err: any) {
    return new Response(err.message, { status: 400 })
  }

  // Auth headers
  const authHeaders = getAuthHeaders(env)

  // DB connection
  let db
  try {
    db = await connectDb(env)
  } catch (err: any) {
    return new Response(`DB connection failed: ${err.message}`, { status: 500 })
  }

  // SSH execution
  let sshOutput
  try {
    sshOutput = await runSshCommand(env, "echo Running tests")
  } catch (err: any) {
    return new Response(`SSH command failed: ${err.message}`, { status: 500 })
  }

  // Logging
  console.log("RUNNING AGAINST:", {
    env: env.name,
    endpoint: env.endpoint.host,
    dbHost: env.db.hostname,
    sshOutput,
  })

  return Response.json({
    ok: true,
    env: env.name,
    endpoint: env.endpoint.host,
    dbHost: env.db.hostname,
    sshOutput,
    authHeaders, // optional debug
  })
}
