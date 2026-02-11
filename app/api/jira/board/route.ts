import { NextResponse } from "next/server"

interface JiraRequest {
  baseUrl: string
  email: string
  apiToken: string
  projectKey: string
  boardId: string
}

interface JiraIssue {
  key: string
  fields: {
    summary: string
    status: { name: string }
    assignee: { displayName: string } | null
    description: string | null
    updated: string
    created: string
  }
}

export async function POST(req: Request) {
  try {
    const body: JiraRequest = await req.json()
    const { baseUrl, email, apiToken, projectKey, boardId } = body

    if (!baseUrl || !email || !apiToken || !projectKey) {
      return NextResponse.json(
        { error: "Missing Jira configuration" },
        { status: 400 }
      )
    }

    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")

    // Fetch issues from the board using Jira Agile REST API
    // Fall back to JQL search if agile API isn't available
    let issues: JiraIssue[] = []

    try {
      // Try agile board endpoint first
      if (boardId) {
        const agileUrl = `${baseUrl}/rest/agile/1.0/board/${boardId}/issue?maxResults=200&fields=summary,status,assignee,description,updated,created`
        const agileRes = await fetch(agileUrl, {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
        })

        if (agileRes.ok) {
          const data = await agileRes.json()
          issues = data.issues || []
        }
      }
    } catch {
      // agile endpoint not available, fall through to JQL
    }

    // Fall back to JQL search
    if (issues.length === 0) {
      const jql = encodeURIComponent(`project = ${projectKey} ORDER BY updated DESC`)
      const searchUrl = `${baseUrl}/rest/api/2/search?jql=${jql}&maxResults=200&fields=summary,status,assignee,description,updated,created`
      const searchRes = await fetch(searchUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      })

      if (!searchRes.ok) {
        const errorText = await searchRes.text()
        return NextResponse.json(
          { error: `Jira API error (${searchRes.status}): ${errorText}` },
          { status: searchRes.status }
        )
      }

      const data = await searchRes.json()
      issues = data.issues || []
    }

    // Map Jira statuses to our kanban columns
    const mapped = issues.map((issue: JiraIssue) => {
      const jiraStatus = issue.fields.status?.name?.toUpperCase() || "TO DO"

      // Map common Jira statuses to our board columns
      let status = "TO DO"
      if (jiraStatus.includes("PROGRESS") || jiraStatus.includes("DEVELOPMENT")) {
        status = "IN PROGRESS"
      } else if (jiraStatus.includes("BLOCK")) {
        status = "BLOCKED"
      } else if (jiraStatus.includes("HOLD") || jiraStatus.includes("WAIT")) {
        status = "ON HOLD"
      } else if (jiraStatus.includes("SST") || jiraStatus.includes("TEST")) {
        status = "SST TESTING"
      } else if (jiraStatus.includes("DONE") || jiraStatus.includes("CLOSED") || jiraStatus.includes("RESOLVED")) {
        status = "DONE"
      } else if (jiraStatus.includes("CANCEL")) {
        status = "CANCELLED"
      } else if (jiraStatus.includes("TODO") || jiraStatus.includes("TO DO") || jiraStatus.includes("OPEN") || jiraStatus.includes("NEW")) {
        status = "TO DO"
      }

      return {
        id: issue.key,
        status,
        summary: `[${issue.key}] ${issue.fields.summary}`,
        branch: "",
        description: issue.fields.description || "",
        assignee: issue.fields.assignee?.displayName || "",
        attachments: [],
        createdAt: issue.fields.created,
        updatedAt: issue.fields.updated,
        comments: [],
      }
    })

    return NextResponse.json({ issues: mapped })
  } catch (err) {
    console.error("Jira API error:", err)
    return NextResponse.json(
      { error: "Failed to fetch from Jira" },
      { status: 500 }
    )
  }
}
