import { Suspense } from "react"
import ClientLogs from "./client-logs"

export default function LogsPage() {
  return (
    <Suspense fallback={<div>Loading logs...</div>}>
      <ClientLogs />
    </Suspense>
  )
}
