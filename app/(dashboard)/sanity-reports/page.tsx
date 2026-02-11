"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { getReports } from "@/lib/sanity-reports"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, FileJson, FileText, Eye, Trash2 } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function SanityReportsPage() {
  const reports = getReports()

  function downloadJSON(report: any) {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.type}_Sanity_${formatDateForFilename(report.createdAt)}.json`
    a.click()
  }

  function downloadExcel(report: any) {
    // Create CSV content (Excel compatible)
    const escapeCSV = (str: string) => {
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const headers = ["Test Name", "Status", "Comment"]
    const rows = report.tests.map((t: any) => [
      escapeCSV(t.testName || t.name || ""),
      escapeCSV(t.status || ""),
      escapeCSV(t.error || t.comment || "-")
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.join(","))
    ].join("\n")

    // Add BOM for Excel to recognize UTF-8
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.type}_Sanity_${formatDateForFilename(report.createdAt)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadPDF(report: any) {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Sanity Report - ${report.type}`, 14, 20)
    doc.setFontSize(12)
    doc.text(`Created At: ${new Date(report.createdAt).toLocaleString()}`, 14, 28)

    autoTable(doc, {
      startY: 36,
      head: [["Test Name", "Status", "Comment"]],
      body: report.tests.map((t: any) => [
        t.testName || t.name,
        t.status,
        t.error || "-",
      ]),
      headStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 1) {
          if (data.cell.raw === "PASS") data.cell.styles.textColor = [0, 128, 0]
          if (data.cell.raw === "FAILED") data.cell.styles.textColor = [220, 0, 0]
        }
      },
      styles: { cellPadding: 2, fontSize: 10 },
    })

    doc.save(`${report.type}_Sanity_${formatDateForFilename(report.createdAt)}.pdf`)
  }

  function formatDateForFilename(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}-${String(d.getMinutes()).padStart(2, "0")}-${String(d.getSeconds()).padStart(2, "0")}`
  }

  function deleteReport(reportId: string) {
    if (!confirm("Are you sure you want to delete this report?")) return
    const existing = JSON.parse(localStorage.getItem("sanityReports") || "[]")
    const updated = existing.filter((r: any) => r.id !== reportId)
    localStorage.setItem("sanityReports", JSON.stringify(updated))
    window.location.reload()
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sanity Reports</h1>
      <p className="text-muted-foreground">
        View and download sanity test reports. Each report is named by date and time.
      </p>

      {reports.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">No sanity reports yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Run a Basic Sanity or selected tests to generate reports
          </p>
        </div>
      )}

      <div className="space-y-3">
        {reports.map((report) => {
          const typeLabel = report.type === "FULL" ? "Full Sanity" : 
                           report.type === "BASIC" ? "Basic Sanity" :
                           report.type === "SELECTED" ? "Selected Tests" : "Scheduled Sanity"
          const envLabel = report.environment || "Unknown"
          const dateStr = new Date(report.createdAt).toLocaleString()
          const filename = `${typeLabel}_${formatDateForFilename(report.createdAt)}`

          const passed = report.tests.filter((t: any) => t.status === "PASS").length
          const failed = report.tests.filter((t: any) => t.status === "FAILED").length
          const total = report.tests.length

          return (
            <Card key={report.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold">{filename}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{envLabel}</Badge>
                    <Badge variant="outline">{total} tests</Badge>
                    <Badge className="bg-green-600 text-white">{passed} PASS</Badge>
                    {failed > 0 && (
                      <Badge className="bg-red-600 text-white">{failed} FAILED</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/sanity-reports/${report.id}`, "_blank")}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadExcel(report)}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPDF(report)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadJSON(report)}
                  >
                    <FileJson className="h-4 w-4 mr-1" />
                    JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReport(report.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
