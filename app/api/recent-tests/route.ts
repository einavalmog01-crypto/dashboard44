import { getActiveEnvironment } from "@/lib/get-active-environment"
import { runSshCommand } from "@/lib/ssh/run-ssh-command.server"

interface RecentTest {
  id: string
  name: string
  status: "passed" | "failed"
  environment: string
  time: string
  type: string
}

export async function GET(req: Request) {
  try {
    const selectedEnv = req.headers.get("x-env")
    if (!selectedEnv) {
      return new Response(
        JSON.stringify({ error: "No active environment selected" }),
        { status: 400 }
      )
    }

    let env
    try {
      env = getActiveEnvironment(selectedEnv)
    } catch {
      return new Response(
        JSON.stringify({ error: `Environment "${selectedEnv}" not found` }),
        { status: 400 }
      )
    }

    // Run JESI command to fetch recent tests
    const raw = await runSshCommand(env, `cd /jesi/tests && ./get_recent_tests.sh`)

    // Assuming JESI returns JSON string:
    const recentTests: RecentTest[] = JSON.parse(raw)

    return new Response(JSON.stringify(recentTests), { status: 200 })
  } catch (err) {
    console.error("Recent Tests API error:", err)
    return new Response(JSON.stringify({ error: "Failed to fetch recent tests" }), { status: 500 })
  }
}
