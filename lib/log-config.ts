import type { Environment } from "@/lib/environment-config"

export type LogServer = "WF1" | "WF2" | "APP1" | "APP2"

export type LogFile = "catalina.out" | "localhost.log" | "application.log" | "error.log"

export interface LogServerConfig {
  name: LogServer
  label: string
  basePath: string
  logFiles: LogFile[]
}

export const logServersConfig: LogServerConfig[] = [
  {
    name: "WF1",
    label: "Wildfly 1",
    basePath: "/opt/wildfly/standalone/log",
    logFiles: ["catalina.out", "application.log", "error.log"],
  },
  {
    name: "WF2",
    label: "Wildfly 2",
    basePath: "/opt/wildfly/standalone/log",
    logFiles: ["catalina.out", "application.log", "error.log"],
  },
  {
    name: "APP1",
    label: "App Server 1",
    basePath: "/var/log/app",
    logFiles: ["application.log", "error.log", "localhost.log"],
  },
  {
    name: "APP2",
    label: "App Server 2",
    basePath: "/var/log/app",
    logFiles: ["application.log", "error.log", "localhost.log"],
  },
]

function randomTimestamp(): string {
  const now = new Date()
  const offset = Math.floor(Math.random() * 60000)
  const ts = new Date(now.getTime() - offset)
  return ts.toISOString().replace("T", " ").slice(0, 23)
}

const logLevels = ["INFO", "DEBUG", "WARN", "ERROR", "TRACE"] as const

const sampleMessages: Record<string, string[]> = {
  "catalina.out": [
    "Server startup in 12345 milliseconds",
    "Deploying web application directory /opt/app",
    "Context initialization completed",
    "HTTP connector started on port 8080",
    "Session created: sessionId=abc123",
    "Request processed: GET /api/health 200 12ms",
    "Database connection pool initialized: min=5, max=20",
    "Cache cleared for region: default",
  ],
  "application.log": [
    "Processing batch job: jobId=batch-001",
    "User authentication successful: userId=admin",
    "Transaction committed: txId=tx-9821",
    "Scheduled task executed: cleanupExpiredSessions",
    "API request: POST /api/v1/orders 201 45ms",
    "Message published to queue: order.created",
    "Configuration reloaded from database",
    "Health check passed: all services operational",
  ],
  "error.log": [
    "NullPointerException at com.app.service.OrderService.process(OrderService.java:142)",
    "Connection refused: host=db-primary, port=5432",
    "Timeout waiting for response from upstream service: 30000ms",
    "OutOfMemoryError: Java heap space",
    "Failed to parse JSON payload: Unexpected token at position 0",
    "SSL handshake failed: certificate expired",
    "Rate limit exceeded for client: ip=192.168.1.100",
    "Deadlock detected in transaction: txId=tx-5523",
  ],
  "localhost.log": [
    "Incoming connection from 10.0.0.1:52341",
    "TLS session established: protocol=TLSv1.3",
    "Request forwarded to backend: upstream=app-cluster",
    "Response returned: status=200, size=4521 bytes",
    "Connection closed: keepAlive=false",
    "Health probe received: source=load-balancer",
    "Static file served: /assets/main.css 304",
    "WebSocket connection upgraded: path=/ws/notifications",
  ],
}

export function generateSimulatedLog(
  server: LogServer,
  file: LogFile,
  environment: Environment
): string {
  const messages = sampleMessages[file] || sampleMessages["application.log"]
  const lineCount = 40 + Math.floor(Math.random() * 20)
  const lines: string[] = []

  for (let i = 0; i < lineCount; i++) {
    const ts = randomTimestamp()
    const level = logLevels[Math.floor(Math.random() * (file === "error.log" ? 2 : logLevels.length))]
    const effectiveLevel = file === "error.log" ? (Math.random() > 0.3 ? "ERROR" : "WARN") : level
    const msg = messages[Math.floor(Math.random() * messages.length)]
    lines.push(`${ts} [${effectiveLevel}] [${environment}/${server}] ${msg}`)
  }

  return lines.join("\n")
}
