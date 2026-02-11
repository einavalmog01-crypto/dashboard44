"use client"

import { useRouter, useParams } from "next/navigation"
import { getReportById } from "@/lib/sanity-reports"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, FileJson, FileText, ArrowLeft } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function SanityReportPage() {
  const router = useRouter()
  const { id } = useParams()
  const report = getReportById(id as string)

  if (!report) {
    return <div className="p-6">Report not found</div>
  }

  function formatDateForFilename(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}-${String(d.getMinutes()).padStart(2, "0")}-${String(d.getSeconds()).padStart(2, "0")}`
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.type}_Sanity_${formatDateForFilename(report.createdAt)}.json`
    a.click()
  }

  function downloadExcel() {
    const escapeCSV = (str: string) => {
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const headers = ["Test Name", "Status", "Comment"]
    const rows = report.tests.map((t) => [
      escapeCSV(t.testName || t.name || ""),
      escapeCSV(t.status || ""),
      escapeCSV(t.error || "-")
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.join(","))
    ].join("\n")

    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.type}_Sanity_${formatDateForFilename(report.createdAt)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadPDF() {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Sanity Report - ${report.type}`, 14, 20)
    doc.setFontSize(12)
    doc.text(`Created At: ${new Date(report.createdAt).toLocaleString()}`, 14, 28)
    doc.text(`Environment: ${report.environment || "Unknown"}`, 14, 36)

    autoTable(doc, {
      startY: 44,
      head: [["Test Name", "Status", "Comment"]],
      body: report.tests.map((t) => [
        t.testName || t.name,
        t.status,
        t.error || "-",
      ]),
      headStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 1) {
          if (data.cell.raw === "PASS") {
            data.cell.styles.textColor = [0, 128, 0]
          } else if (data.cell.raw === "FAILED") {
            data.cell.styles.textColor = [220, 0, 0]
          }
        }
      },
      styles: { cellPadding: 2, fontSize: 10 },
    })

    doc.save(`${report.type}_Sanity_${formatDateForFilename(report.createdAt)}.pdf`)
  }

  const typeLabel = report.type === "FULL" ? "Full Sanity" : 
                   report.type === "BASIC" ? "Basic Sanity" :
                   report.type === "SELECTED" ? "Selected Tests" : "Scheduled Sanity"
  const passed = report.tests.filter((t) => t.status === "PASS").length
  const failed = report.tests.filter((t) => t.status === "FAILED").length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/sanity-reports")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {typeLabel} - {formatDateForFilename(report.createdAt)}
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date(report.createdAt).toLocaleString()} | Environment: {report.environment || "Unknown"}
        </p>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline">{report.tests.length} tests</Badge>
          <Badge className="bg-green-600 text-white">{passed} PASS</Badge>
          {failed > 0 && (
            <Badge className="bg-red-600 text-white">{failed} FAILED</Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={downloadExcel} className="text-green-600 border-green-600">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
        <Button variant="outline" onClick={downloadPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={downloadJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Download JSON
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Test Name</th>
              <th className="text-left p-3 font-medium w-24">Status</th>
              <th className="text-left p-3 font-medium">Comment</th>
            </tr>
          </thead>
          <tbody>
            {report.tests.map((t, i) => (
              <tr key={i} className="border-t hover:bg-muted/50">
                <td className="p-3">{t.testName || t.name}</td>
                <td className="p-3">
                  <Badge
                    variant={t.status === "PASS" ? "default" : "destructive"}
                    className={t.status === "PASS" ? "bg-green-600" : ""}
                  >
                    {t.status}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">{t.error || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
