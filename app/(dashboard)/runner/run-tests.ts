import { runSshCommand } from "@/APP/ssh/run-ssh-command.server"
import type { EnvironmentConfig } from "@/lib/environment-config"

export async function runTests(env: EnvironmentConfig) {
  const command = "cd /jesi && ./run_tests.sh"

  const result = await runSshCommand(env, command)

  return result
}
