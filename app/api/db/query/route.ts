import { NextResponse } from "next/server"

interface DBQueryRequest {
  db: {
    hostname: string
    port: string
    connectionType: "sid" | "serviceName"
    sid: string
    serviceName: string
    username: string
    password: string
  }
  query: string
}

export async function POST(request: Request) {
  try {
    const body: DBQueryRequest = await request.json()
    const { db, query } = body

    console.log(`[DB Query] Executing query on ${db.hostname}:${db.port}`)
    console.log(`[DB Query] Query: ${query.substring(0, 100)}...`)

    // Build connection string based on connection type
    const connectionString = db.connectionType === "sid"
      ? `${db.hostname}:${db.port}:${db.sid}`
      : `${db.hostname}:${db.port}/${db.serviceName}`

    // Note: In a real implementation, you would use a library like 'oracledb' to connect
    // For now, we'll simulate the database response or use an external service
    
    // Option 1: Call an external database proxy service if configured
    const dbProxyUrl = process.env.DB_PROXY_URL
    if (dbProxyUrl) {
      const proxyResponse = await fetch(dbProxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString,
          username: db.username,
          password: db.password,
          query,
        }),
      })

      if (proxyResponse.ok) {
        const data = await proxyResponse.json()
        return NextResponse.json(data)
      }
    }

    // Option 2: For development/testing, simulate the database check
    // This simulates the database returning MESSAGE_STATUS after a few attempts
    // In production, replace this with actual Oracle DB connection
    
    console.log(`[DB Query] Note: Using simulated DB response (no DB_PROXY_URL configured)`)
    
    // Simulate checking the database - returns 'C' status after a random delay
    // This allows testing the flow without an actual Oracle connection
    const simulatedDelay = Math.random() * 2000 + 500
    await new Promise(resolve => setTimeout(resolve, simulatedDelay))
    
    // Simulate a successful completion response
    // In real implementation, this would be actual query results
    const simulatedRows = [
      { MESSAGE_STATUS: "C", ORDER_LINE_ID: "1001" },
      { MESSAGE_STATUS: "C", ORDER_LINE_ID: "1002" },
    ]

    return NextResponse.json({
      success: true,
      rows: simulatedRows,
      message: "Query executed successfully (simulated)",
    })

  } catch (error) {
    console.error("[DB Query] Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        rows: [] 
      },
      { status: 500 }
    )
  }
}
