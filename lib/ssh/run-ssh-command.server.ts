import type { EnvironmentConfig } from "@/lib/environment-config"

/**
 * Runs a command on the remote server via SSH.
 * Requires the `ssh2` package to be installed.
 *
 * Falls back to an error message if SSH is not configured or unavailable.
 */
export async function runSshCommand(
  env: EnvironmentConfig,
  command: string
): Promise<string> {
  const { unix } = env

  if (!unix.hostName || !unix.userName || !unix.password) {
    throw new Error(
      `SSH not configured for environment "${env.name}". Please configure UNIX settings in Settings.`
    )
  }

  try {
    // Dynamic import to avoid bundling ssh2 on the client
    const { Client } = await import("ssh2")

    return new Promise<string>((resolve, reject) => {
      const conn = new Client()
      let output = ""

      conn
        .on("ready", () => {
          conn.exec(command, (err, stream) => {
            if (err) {
              conn.end()
              return reject(err)
            }

            stream.on("data", (data: Buffer) => {
              output += data.toString()
            })

            stream.stderr.on("data", (data: Buffer) => {
              output += data.toString()
            })

            stream.on("close", () => {
              conn.end()
              resolve(output.trim())
            })
          })
        })
        .on("error", (err) => {
          reject(
            new Error(`SSH connection failed to ${unix.hostName}: ${err.message}`)
          )
        })
        .connect({
          host: unix.hostName,
          port: parseInt(unix.port || "22", 10),
          username: unix.userName,
          password: unix.password,
        })
    })
  } catch (err: any) {
    throw new Error(`SSH command failed: ${err.message}`)
  }
}
