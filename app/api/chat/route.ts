import { runCursorAgent } from "@/lib/cursor-cli/run-cursor-agent.server"

interface ChatAttachment {
  name: string
  type: string
  size: number
  base64?: string
}

interface ChatRequest {
  message: string
  environment: string
  attachments?: ChatAttachment[]
  config: {
    auth: { username: string; password: string }
    endpoint: { host: string }
    unix: { hostName: string; port: string; userName: string; password: string }
  }
}

export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json()
    const { message, attachments } = body

    if ((!message || !message.trim()) && (!attachments || attachments.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Message or attachments required" }),
        { status: 400 }
      )
    }

    // Build a prompt that includes attachment context
    let fullPrompt = message || ""
    if (attachments && attachments.length > 0) {
      const attachmentContext = attachments
        .map((a) => {
          let desc = `[Attached: ${a.name} (${a.type}, ${a.size} bytes)]`
          // For text-based files, decode and include content
          if (a.base64 && (
            a.type.startsWith("text/") ||
            a.type === "application/json" ||
            a.type === "application/xml" ||
            a.name.match(/\.(txt|csv|json|xml|yaml|yml|md|log|html|css|js|ts|tsx|jsx|py|java|c|cpp|go|rs|rb|sh|sql)$/i)
          )) {
            try {
              const decoded = Buffer.from(a.base64, "base64").toString("utf-8")
              desc += `\nFile contents:\n\`\`\`\n${decoded}\n\`\`\``
            } catch {
              // If decoding fails, just include the description
            }
          }
          return desc
        })
        .join("\n\n")
      
      fullPrompt = `${attachmentContext}\n\n${fullPrompt}`
    }

    // Use Cursor CLI agent to process the prompt
    const reply = await runCursorAgent(fullPrompt)

    return new Response(JSON.stringify({ reply }), { status: 200 })
  } catch (err: any) {
    console.error("Chat API error:", err)
    const errorMessage = err?.message || "Failed to get response from Cursor CLI"
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    })
  }
}
