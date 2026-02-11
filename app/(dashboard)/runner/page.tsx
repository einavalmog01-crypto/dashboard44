"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useEnvironment } from "@/lib/environment-context"
import { CheckCircle, XCircle, Clock, Loader2, Settings2, CalendarClock, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"


interface TestCase {
  id: string
  name: string
  suite: string
  description?: string
  status: "idle" | "running" | "passed" | "failed"
  selected: boolean
  comment?: string
  customTemplates?: {
    [stepName: string]: string
  }
}

interface StepResult {
  name: string
  status: "PASS" | "FAILED"
  message: string
  request?: string
  response?: string
}

interface TestResult {
  testId: string
  testName: string
  environment: string
  success: boolean
  steps: StepResult[]
  error?: string
  timestamp: string
}

// Tests included in Basic Sanity
const BASIC_SANITY_TESTS = [
  "cable-submit-order",
  "mobile-telesales-submit-order",
  "mobile-retail-submit-order",
  "dsl-ils-submit-order",
  "dsl-new-submit-order",
  "search-customer",
  "legacy-search",
]

const initialTests: TestCase[] = [
  { 
    id: "cable-submit-order", 
    name: "Cable Submit Order", 
    suite: "Cable", 
    description: "1. SubmitOrder (GC + Fulfillment) -> 2. DB Check SOS -> 3. SetOrderStatus -> 4. DB Check SOS",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "mobile-telesales-submit-order", 
    name: "Mobile Telesales Submit Order", 
    suite: "Mobile", 
    description: "1. SubmitOrder (GC + Fulfillment) -> 2. DB Check SOS (C/D) -> 3. FRIDA Processing -> 4. SetOrderStatus_EAI -> 5. DB Check SOS -> 6. OMSendDocumentCallback -> 7. DB Check SOS -> 8. HWFulfilmentReady -> 9. DB Check SOS",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "mobile-retail-submit-order", 
    name: "Mobile Retail Submit Order", 
    suite: "Mobile", 
    description: "1. SubmitOrder (GC + Fulfillment) -> 2. DB Check SOS -> 3. SetOrderStatus_EAI (each OrderLineID) -> 4. DB Check SOS -> 5. IMPORTED_IN_VORAS (each OrderLineID) -> 6. DB Check SOS -> 7. VORAS_FINAL_SUCCESS_HANDOUT (each OrderLineID) -> 8. DB Check SOS",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "get-order", 
    name: "GetOrder", 
    suite: "Order", 
    description: "1. SubmitOrder (GC + Fulfillment) -> 2. DB Check SOS -> 3. SetOrderStatus_EAI (each OrderLineID) -> 4. DB Check SOS -> 5. GetOrder",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "get-documents", 
    name: "GetDocuments", 
    suite: "Order", 
    description: "1. SubmitOrder (GC + Fulfillment) -> 2. DB Check SOS -> 3. DB Check AUFTRAG_ID -> 4. OMSendDocumentCallback -> 5. DB Check ACMS -> 6. GetDocuments",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "dsl-ils-submit-order",
    name: "DSL_ILS Submit Order", 
    suite: "DSL", 
    description: "1. SubmitOrder (GC + Fulfillment) -> 2. DB Check SOS -> 3. DB Check BAR_CODE -> 4. SetFNOrderStatus CUSTOMER_CREATED -> 5. DB Check SOS -> 6. SetFNOrderStatus ORDER_COMPLETED -> 7. DB Check SOS",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "dsl-new-submit-order",
    name: "DSL_NEW Submit Order", 
    suite: "DSL", 
    description: "1. SubmitOrder (GC + Fulfillment) -> 2. DB Check SOS -> 3. DB Check BAR_CODE -> 4. SetFNOrderStatus CONFIRMATION_OK -> 5. DB Check SOS -> 6. SetFNOrderStatus CUSTOMER_CREATED -> 7. DB Check SOS -> 8. SetFNOrderStatus ORDER_COMPLETED -> 9. DB Check SOS",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "search-customer", 
    name: "Customer Search", 
    suite: "Customer", 
    description: "CustomerSearch SOAP request with random CustomerID, validates ErrorCode OGWERR-0000 and SUCCESS response",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
  { 
    id: "legacy-search", 
    name: "Legacy Search", 
    suite: "Legacy", 
    description: "LegacySearch SOAP request with random CustomerID, validates ErrorCode OGWERR-0000 and SUCCESS response",
    status: "idle", 
    selected: false, 
    comment: "" 
  },
]

// Default FRIDA evidence JSON template
const DEFAULT_FRIDA_EVIDENCE = `[
    {
        "orderNumber":"{{OGW_ORDER_ID}}.{{ORDER_LINE_ID}}",
        "naiveScore": 2,
        "fraudLevel": "Kein Betrug",
        "fraudAction": "Freigeben",
        "checkDate": "{{TIMESTAMP}}"
    }
]`

function saveSanityReport(
  type: "FULL" | "BASIC" | "SELECTED" | "SCHEDULED",
  environment: string,
  tests: { name: string; status: "PASS" | "FAILED"; error: string; comment?: string }[]
) {
  const report = {
    id: crypto.randomUUID(),
    type,
    environment,
    createdAt: new Date().toISOString(),
    tests,
  }

  const existing = JSON.parse(localStorage.getItem("sanityReports") || "[]")
  localStorage.setItem("sanityReports", JSON.stringify([report, ...existing]))

  return report.id
}

export default function TestRunnerPage() {
  const router = useRouter()
  const { selectedEnv, currentEnvironmentConfig } = useEnvironment()
  const [tests, setTests] = useState(initialTests)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [expandedResult, setExpandedResult] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const [scheduledSanities, setScheduledSanities] = useState<string[]>([])
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [configureTestId, setConfigureTestId] = useState<string | null>(null)
  const [editingTemplates, setEditingTemplates] = useState<{ [stepName: string]: string }>({})
  const [scheduleType, setScheduleType] = useState<"basic">("basic")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "monthly">("daily")
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [currentRunningTest, setCurrentRunningTest] = useState<string | null>(null)
  const [runProgress, setRunProgress] = useState({ current: 0, total: 0 })
  const [completedTestIds, setCompletedTestIds] = useState<string[]>([])

  const selectedTests = tests.filter(t => t.selected)
  const passed = tests.filter(t => t.status === "passed").length
  const failed = tests.filter(t => t.status === "failed").length

async function runBasicSanity() {
  if (!currentEnvironmentConfig?.isConfigured) {
    alert(`Environment ${selectedEnv} is not configured. Please go to Settings and configure the credentials.`)
    return
  }

  setIsRunning(true)
  setTestResults([])
  setCompletedTestIds([])
  const results: { name: string; status: "PASS" | "FAILED"; error: string; comment?: string }[] = []

  // Get tests that are in the Basic Sanity list
  const basicSanityTests = tests.filter(t => BASIC_SANITY_TESTS.includes(t.id))
  setRunProgress({ current: 0, total: basicSanityTests.length })

  for (let i = 0; i < basicSanityTests.length; i++) {
    const test = basicSanityTests[i]
    setCurrentRunningTest(test.name)
    setRunProgress({ current: i, total: basicSanityTests.length })
    setTests(t => t.map(x => x.id === test.id ? { ...x, status: "running" } : x))

    try {
      const response = await fetch("/api/run/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: test.id,
          testName: test.name,
          environment: selectedEnv,
          config: {
            auth: currentEnvironmentConfig.auth,
            db: currentEnvironmentConfig.db,
            endpoint: currentEnvironmentConfig.endpoint,
            unix: currentEnvironmentConfig.unix,
          },
          customTemplates: test.customTemplates,
        }),
      })

      const data = await response.json()
      const passed = data.success

      setTests(t => t.map(x => x.id === test.id ? { ...x, status: passed ? "passed" : "failed" } : x))
      setCompletedTestIds(prev => [...prev, test.id])

      setTestResults(prev => [...prev, {
        testId: test.id,
        testName: test.name,
        environment: selectedEnv,
        success: passed,
        steps: data.steps || [],
        error: data.error,
        timestamp: new Date().toISOString(),
      }])

      results.push({
        name: test.name,
        status: passed ? "PASS" : "FAILED",
        error: data.error || "",
        comment: test.comment,
      })
    } catch (error) {
      setTests(t => t.map(x => x.id === test.id ? { ...x, status: "failed" } : x))
      setCompletedTestIds(prev => [...prev, test.id])

      setTestResults(prev => [...prev, {
        testId: test.id,
        testName: test.name,
        environment: selectedEnv,
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }])

      results.push({
        name: test.name,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        comment: test.comment,
      })
    }
  }

  // Save as BASIC sanity report
  saveSanityReport("BASIC", selectedEnv, results)
  setIsRunning(false)
  setCurrentRunningTest(null)
  setRunProgress({ current: basicSanityTests.length, total: basicSanityTests.length })
}

async function runSelected() {
  if (!currentEnvironmentConfig?.isConfigured) {
    alert(`Environment ${selectedEnv} is not configured. Please go to Settings and configure the credentials.`)
    return
  }

  setIsRunning(true)
  setTestResults([]) // Clear previous results
  const results: { name: string; status: "PASS" | "FAILED"; error: string; comment?: string }[] = []

  for (const test of selectedTests) {
    setTests(t => t.map(x => x.id === test.id ? { ...x, status: "running" } : x))

    try {
      // Call the API with environment config and custom templates
      const response = await fetch("/api/run/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: test.id,
          testName: test.name,
          environment: selectedEnv,
          config: {
            auth: currentEnvironmentConfig.auth,
            db: currentEnvironmentConfig.db,
            endpoint: currentEnvironmentConfig.endpoint,
            unix: currentEnvironmentConfig.unix,
          },
          customTemplates: test.customTemplates,
        }),
      })

      const data = await response.json()
      const passed = data.success

      setTests(t =>
        t.map(x =>
          x.id === test.id
            ? { ...x, status: passed ? "passed" : "failed" }
            : x
        )
      )

      // Add to test results with full step details
      setTestResults(prev => [...prev, {
        testId: test.id,
        testName: test.name,
        environment: selectedEnv,
        success: passed,
        steps: data.steps || [],
        error: data.error,
        timestamp: new Date().toISOString(),
      }])

      results.push({
        name: test.name,
        status: passed ? "PASS" : "FAILED",
        error: data.error || "",
        comment: test.comment,
      })
    } catch (error) {
      setTests(t =>
        t.map(x =>
          x.id === test.id ? { ...x, status: "failed" } : x
        )
      )

      setTestResults(prev => [...prev, {
        testId: test.id,
        testName: test.name,
        environment: selectedEnv,
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }])

      results.push({
        name: test.name,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        comment: test.comment,
      })
    }
  }

  // Save report
  saveSanityReport("SELECTED", selectedEnv, results)
  setIsRunning(false)
}


  function scheduleSanity() {
    if (!scheduleDate || !scheduleTime) {
      alert("Please select date and time")
      return
    }
    
    const schedule = {
      id: crypto.randomUUID(),
      type: scheduleType,
      environment: selectedEnv,
      date: scheduleDate,
      time: scheduleTime,
      recurrence: recurrence,
      createdAt: new Date().toISOString(),
      isActive: true,
    }
    
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem("scheduledSanities") || "[]")
    localStorage.setItem("scheduledSanities", JSON.stringify([schedule, ...existing]))
    
    setScheduledSanities(prev => [
      `${scheduleType.toUpperCase()} Sanity on ${selectedEnv} — ${scheduleDate} ${scheduleTime} (${recurrence})`,
      ...prev
    ])
    setIsScheduleModalOpen(false)
    setScheduleDate("")
    setScheduleTime("")
    
    alert(`Sanity scheduled for ${scheduleDate} at ${scheduleTime} (${recurrence})`)
  }

  function handleCommentChange(testId: string, value: string) {
    setTests(tests =>
      tests.map(t => t.id === testId ? { ...t, comment: value } : t)
    )
  }

  function openConfigureModal(testId: string) {
    const test = tests.find(t => t.id === testId)
    const orderId = "{{ORDER_ID}}"
    const ogwOrderId = "{{OGW_ORDER_ID}}"
    const orderLineId = "{{ORDER_LINE_ID}}"
    
    const defaultSubmitOrderGC = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SubmitOrder>
      <OrderID>${orderId}</OrderID>
      <Mode>GenerateContract</Mode>
      <OGWOrderID></OGWOrderID>
    </vfde:SubmitOrder>
  </soapenv:Body>
</soapenv:Envelope>`

    const defaultSubmitOrderFulfillment = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SubmitOrder>
      <OrderID>${orderId}</OrderID>
      <Mode>Fulfillment</Mode>
      <OGWOrderID>${ogwOrderId}</OGWOrderID>
    </vfde:SubmitOrder>
  </soapenv:Body>
</soapenv:Envelope>`

    const defaultSetOrderStatus = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SetOrderStatus>
      <OGWSubOrderId>${ogwOrderId}</OGWSubOrderId>
      <OGWSubscriberId>${orderLineId}</OGWSubscriberId>
    </vfde:SetOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`

if (testId === "cable-submit-order") {
      setEditingTemplates({
        "1. SubmitOrder (GenerateContract)": test?.customTemplates?.["1. SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "1. SubmitOrder (Fulfillment)": test?.customTemplates?.["1. SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "2. DB Check: SOS": test?.customTemplates?.["2. DB Check: SOS"] || `-- Wait for SOS MESSAGE_STATUS = C
-- INPUT: OGW_ORDER_ID from SubmitOrder response
SELECT M.MESSAGE_STATUS, EXTRACTVALUE(XMLTYPE(M.MESSAGE_DATA), '//*[local-name()="OGWOrderLineId"]') AS OrderLineId
FROM set_order_status_req_handler M WHERE TRIM(M.CDM_TXID) = TRIM('{{OGW_ORDER_ID}}')
ORDER BY TO_NUMBER(M.SUBSCRIBE_MESSAGE_ID);`,
        "3. SetOrderStatus": test?.customTemplates?.["3. SetOrderStatus"] || defaultSetOrderStatus,
        "4. DB Check: SOS (Final)": test?.customTemplates?.["4. DB Check: SOS (Final)"] || `-- Validate final SOS completion after SetOrderStatus`,
      })
} else if (testId === "mobile-telesales-submit-order") {
      setEditingTemplates({
        "1. SubmitOrder (GenerateContract)": test?.customTemplates?.["1. SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "1. SubmitOrder (Fulfillment)": test?.customTemplates?.["1. SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "2. DB Check: SOS (C/D)": test?.customTemplates?.["2. DB Check: SOS (C/D)"] || `-- Wait for SOS MESSAGE_STATUS = C or D
-- OUTPUT: ORDER_LINE_IDS array for subsequent steps`,
        "3. FRIDA Processing": test?.customTemplates?.["3. FRIDA Processing"] || `-- For EACH OrderLineID:
-- a) Create FRIDA Evidence JSON file
-- b) Wait for files to be consumed
-- c) Validate OGW_FRIDA_SUBSCRIBER_INFO DB record exists

${DEFAULT_FRIDA_EVIDENCE}`,
        "4. SetOrderStatus_EAI (each OrderLineID)": test?.customTemplates?.["4. SetOrderStatus_EAI (each OrderLineID)"] || defaultSetOrderStatus,
        "5. DB Check: SOS": test?.customTemplates?.["5. DB Check: SOS"] || `-- Wait for SOS completion after SetOrderStatus_EAI`,
        "6. OMSendDocumentCallback (each OrderLineID)": test?.customTemplates?.["6. OMSendDocumentCallback (each OrderLineID)"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:sendDocumentResponse>
      <auftragId>{{AUFTRAG_ID}}</auftragId>
      <externeId>{{OGW_ORDER_ID}}|{{ORDER_LINE_ID}}|P</externeId>
    </vfde:sendDocumentResponse>
  </soapenv:Body>
</soapenv:Envelope>`,
        "7. DB Check: SOS": test?.customTemplates?.["7. DB Check: SOS"] || `-- Wait for SOS completion after OMSendDocumentCallback`,
        "8. HWFulfilmentReady (each OrderLineID)": test?.customTemplates?.["8. HWFulfilmentReady (each OrderLineID)"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SetOrderStatus>
      <OGWSubOrderId>{{OGW_ORDER_ID}}</OGWSubOrderId>
      <OGWOrderLineId>{{ORDER_LINE_ID}}</OGWOrderLineId>
    </vfde:SetOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`,
        "9. DB Check: SOS (Final)": test?.customTemplates?.["9. DB Check: SOS (Final)"] || `-- Final SOS validation`,
      })
} else if (testId === "mobile-retail-submit-order") {
      setEditingTemplates({
        "1. SubmitOrder (GenerateContract)": test?.customTemplates?.["1. SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "1. SubmitOrder (Fulfillment)": test?.customTemplates?.["1. SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "2. DB Check: SOS": test?.customTemplates?.["2. DB Check: SOS"] || `-- Wait for SOS MESSAGE_STATUS = C
-- OUTPUT: ORDER_LINE_IDS array for subsequent steps`,
        "3. SetOrderStatus_EAI (each OrderLineID)": test?.customTemplates?.["3. SetOrderStatus_EAI (each OrderLineID)"] || defaultSetOrderStatus,
        "4. DB Check: SOS": test?.customTemplates?.["4. DB Check: SOS"] || `-- Wait for SOS after SetOrderStatus_EAI`,
        "5. IMPORTED_IN_VORAS (each OrderLineID)": test?.customTemplates?.["5. IMPORTED_IN_VORAS (each OrderLineID)"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SetOrderStatus>
      <OGWSubOrderId>{{OGW_ORDER_ID}}</OGWSubOrderId>
      <OGWOrderLineId>{{ORDER_LINE_ID}}</OGWOrderLineId>
    </vfde:SetOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`,
        "6. DB Check: SOS": test?.customTemplates?.["6. DB Check: SOS"] || `-- Wait for SOS after IMPORTED_IN_VORAS`,
        "7. VORAS_FINAL_SUCCESS_HANDOUT (each OrderLineID)": test?.customTemplates?.["7. VORAS_FINAL_SUCCESS_HANDOUT (each OrderLineID)"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SetOrderStatus>
      <OGWSubOrderId>{{OGW_ORDER_ID}}</OGWSubOrderId>
      <OGWOrderLineId>{{ORDER_LINE_ID}}</OGWOrderLineId>
    </vfde:SetOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`,
        "8. DB Check: SOS (Final)": test?.customTemplates?.["8. DB Check: SOS (Final)"] || `-- Final SOS validation`,
      })
} else if (testId === "get-order") {
      setEditingTemplates({
        "1. SubmitOrder (GenerateContract)": test?.customTemplates?.["1. SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "1. SubmitOrder (Fulfillment)": test?.customTemplates?.["1. SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "2. DB Check: SOS": test?.customTemplates?.["2. DB Check: SOS"] || `-- Wait for SOS MESSAGE_STATUS = C
-- OUTPUT: ORDER_LINE_IDS array`,
        "3. SetOrderStatus_EAI (each OrderLineID)": test?.customTemplates?.["3. SetOrderStatus_EAI (each OrderLineID)"] || defaultSetOrderStatus,
        "4. DB Check: SOS": test?.customTemplates?.["4. DB Check: SOS"] || `-- Wait for SOS after SetOrderStatus_EAI`,
        "5. GetOrder": test?.customTemplates?.["5. GetOrder"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:GetOrder>
      <OGWOrderId>{{OGW_ORDER_ID}}</OGWOrderId>
    </vfde:GetOrder>
  </soapenv:Body>
</soapenv:Envelope>`,
      })
    } else if (testId === "get-documents") {
      setEditingTemplates({
        "1. SubmitOrder (GenerateContract + Fulfillment)": test?.customTemplates?.["1. SubmitOrder (GenerateContract + Fulfillment)"] || `<!-- STEP 1: SubmitOrder calls (GenerateContract then Fulfillment) -->
<!-- OUTPUT: Extracts OGW_ORDER_ID from response for use in subsequent steps -->

${defaultSubmitOrderGC}

<!-- Then Fulfillment request follows with same structure -->`,
        "2. DB Check: SOS Completion": test?.customTemplates?.["2. DB Check: SOS Completion"] || `-- STEP 2: Wait for SOS MESSAGE_STATUS = C
-- INPUT: Uses OGW_ORDER_ID from Step 1
-- Polls until all rows have MESSAGE_STATUS = 'C'

SELECT 
    M.MESSAGE_STATUS,
    EXTRACTVALUE(XMLTYPE(M.MESSAGE_DATA), '//*[local-name()="OGWOrderLineId"]') AS OrderLineId,
    M.MESSAGE_DATA
FROM set_order_status_req_handler M
WHERE TRIM(M.CDM_TXID) = TRIM('{{OGW_ORDER_ID}}')
ORDER BY TO_NUMBER(M.SUBSCRIBE_MESSAGE_ID);

-- Expected: All rows should have MESSAGE_STATUS = 'C'
-- Validates ErrorCodes are OGWERR-0000 or 60507`,
        "3. DB Check: AUFTRAG_ID": test?.customTemplates?.["3. DB Check: AUFTRAG_ID"] || `-- STEP 3: Retrieve AUFTRAG_ID from OGW_SEND_DOCUMENT_TRANSACTIONS
-- INPUT: Uses OGW_ORDER_ID from Step 1
-- OUTPUT: AUFTRAG_ID to be used in Steps 4 and 6

SELECT AUFTRAG_ID 
FROM OGW_SEND_DOCUMENT_TRANSACTIONS 
WHERE OGW_ORDER_ID = '{{OGW_ORDER_ID}}'
ORDER BY AUFTRAG_ID DESC;

-- Takes the first (most recent) row
-- Stores AUFTRAG_ID for OMSendDocumentCallback and GetDocuments`,
        "4. OMSendDocumentCallback": test?.customTemplates?.["4. OMSendDocumentCallback"] || `<!-- STEP 4: OMSendDocumentCallback -->
<!-- INPUT: Uses OGW_ORDER_ID from Step 1 and AUFTRAG_ID from Step 3 -->

<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:epsm="http://epsm.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <epsm:sendDocumentResponse>
      <epsm:externeId>{{OGW_ORDER_ID}}||P|Mobile_Postpaid</epsm:externeId>
      <epsm:auftragId>{{AUFTRAG_ID}}</epsm:auftragId>
    </epsm:sendDocumentResponse>
  </soapenv:Body>
</soapenv:Envelope>`,
        "5. DB Check: ACMS_Content": test?.customTemplates?.["5. DB Check: ACMS_Content"] || `-- STEP 5: Wait for ACMS_Content record
-- INPUT: Uses OGW_ORDER_ID from Step 1
-- Polls until record exists

SELECT COUNT(1) 
FROM ACMS_CONTENT 
WHERE STR1 = '{{OGW_ORDER_ID}}';

-- Expected: COUNT > 0`,
        "6. GetDocuments": test?.customTemplates?.["6. GetDocuments"] || `<!-- STEP 6: GetDocuments -->
<!-- INPUT: Uses ORDER_ID, AUFTRAG_ID from Step 3, LINE_OF_BUSINESS -->

<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:GetDocuments>
      <OriginatingID>{{ORDER_ID}}</OriginatingID>
      <DocumentID>{{AUFTRAG_ID}}</DocumentID>
      <LineOfBusiness>{{LINE_OF_BUSINESS}}</LineOfBusiness>
    </vfde:GetDocuments>
  </soapenv:Body>
</soapenv:Envelope>`,
      })
} else if (testId === "dsl-ils-submit-order") {
      setEditingTemplates({
        "1. SubmitOrder (GenerateContract)": test?.customTemplates?.["1. SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "1. SubmitOrder (Fulfillment)": test?.customTemplates?.["1. SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "2. DB Check: SOS": test?.customTemplates?.["2. DB Check: SOS"] || `-- Wait for SOS MESSAGE_STATUS = C`,
        "3. DB Check: BAR_CODE": test?.customTemplates?.["3. DB Check: BAR_CODE"] || `-- Retrieve BAR_CODE from OGW_BARCODE_MAPPING
SELECT TRIM(BAR_CODE) FROM OGW_BARCODE_MAPPING WHERE OGW_ORDER_ID = '{{OGW_ORDER_ID}}';
-- OUTPUT: BAR_CODE for SetFNOrderStatus calls`,
        "4. SetFNOrderStatus CUSTOMER_CREATED": test?.customTemplates?.["4. SetFNOrderStatus CUSTOMER_CREATED"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ogw="http://ogw.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <ogw:SetFNOrderStatus>
      <ogw:orderId>{{BAR_CODE}}</ogw:orderId>
      <ogw:barcode>{{BAR_CODE}}</ogw:barcode>
      <ogw:status>CUSTOMER_CREATED</ogw:status>
    </ogw:SetFNOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`,
        "5. DB Check: SOS": test?.customTemplates?.["5. DB Check: SOS"] || `-- Wait for SOS after CUSTOMER_CREATED`,
        "6. SetFNOrderStatus ORDER_COMPLETED": test?.customTemplates?.["6. SetFNOrderStatus ORDER_COMPLETED"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ogw="http://ogw.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <ogw:SetFNOrderStatus>
      <ogw:orderId>{{BAR_CODE}}</ogw:orderId>
      <ogw:barcode>{{BAR_CODE}}</ogw:barcode>
      <ogw:status>ORDER_COMPLETED</ogw:status>
    </ogw:SetFNOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`,
        "7. DB Check: SOS (Final)": test?.customTemplates?.["7. DB Check: SOS (Final)"] || `-- Final SOS validation`,
      })
    } else if (testId === "dsl-new-submit-order") {
      setEditingTemplates({
        "1. SubmitOrder (GenerateContract)": test?.customTemplates?.["1. SubmitOrder (GenerateContract)"] || defaultSubmitOrderGC,
        "1. SubmitOrder (Fulfillment)": test?.customTemplates?.["1. SubmitOrder (Fulfillment)"] || defaultSubmitOrderFulfillment,
        "2. DB Check: SOS": test?.customTemplates?.["2. DB Check: SOS"] || `-- Wait for SOS MESSAGE_STATUS = C`,
        "3. DB Check: BAR_CODE": test?.customTemplates?.["3. DB Check: BAR_CODE"] || `-- Retrieve BAR_CODE from OGW_BARCODE_MAPPING
SELECT TRIM(BAR_CODE) FROM OGW_BARCODE_MAPPING WHERE OGW_ORDER_ID = '{{OGW_ORDER_ID}}';
-- OUTPUT: BAR_CODE for SetFNOrderStatus calls`,
        "4. SetFNOrderStatus CONFIRMATION_OK": test?.customTemplates?.["4. SetFNOrderStatus CONFIRMATION_OK"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ogw="http://ogw.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <ogw:SetFNOrderStatus>
      <ogw:orderId>{{BAR_CODE}}</ogw:orderId>
      <ogw:barcode>{{BAR_CODE}}</ogw:barcode>
      <ogw:status>CONFIRMATION_OK</ogw:status>
    </ogw:SetFNOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`,
        "5. DB Check: SOS": test?.customTemplates?.["5. DB Check: SOS"] || `-- Wait for SOS after CONFIRMATION_OK`,
        "6. SetFNOrderStatus CUSTOMER_CREATED": test?.customTemplates?.["6. SetFNOrderStatus CUSTOMER_CREATED"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ogw="http://ogw.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <ogw:SetFNOrderStatus>
      <ogw:orderId>{{BAR_CODE}}</ogw:orderId>
      <ogw:barcode>{{BAR_CODE}}</ogw:barcode>
      <ogw:status>CUSTOMER_CREATED</ogw:status>
    </ogw:SetFNOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`,
        "7. DB Check: SOS": test?.customTemplates?.["7. DB Check: SOS"] || `-- Wait for SOS after CUSTOMER_CREATED`,
        "8. SetFNOrderStatus ORDER_COMPLETED": test?.customTemplates?.["8. SetFNOrderStatus ORDER_COMPLETED"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ogw="http://ogw.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <ogw:SetFNOrderStatus>
      <ogw:orderId>{{BAR_CODE}}</ogw:orderId>
      <ogw:barcode>{{BAR_CODE}}</ogw:barcode>
      <ogw:status>ORDER_COMPLETED</ogw:status>
    </ogw:SetFNOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`,
        "9. DB Check: SOS (Final)": test?.customTemplates?.["9. DB Check: SOS (Final)"] || `-- Final SOS validation`,
      })
    } else if (testId === "search-customer") {
      setEditingTemplates({
        "CustomerSearch": test?.customTemplates?.["CustomerSearch"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:CustomerSearch>
      <CustomerID>{{CUSTOMER_ID}}</CustomerID>
    </vfde:CustomerSearch>
  </soapenv:Body>
</soapenv:Envelope>`,
      })
    } else if (testId === "legacy-search") {
      setEditingTemplates({
        "LegacySearch": test?.customTemplates?.["LegacySearch"] || `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:LegacySearch>
      <CustomerID>{{CUSTOMER_ID}}</CustomerID>
    </vfde:LegacySearch>
  </soapenv:Body>
</soapenv:Envelope>`,
      })
    }
    setConfigureTestId(testId)
  }

  function saveTestTemplates() {
    if (!configureTestId) return
    setTests(tests =>
      tests.map(t => 
        t.id === configureTestId 
          ? { ...t, customTemplates: editingTemplates }
          : t
      )
    )
    setConfigureTestId(null)
    setEditingTemplates({})
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Test Queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Test Queue</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Environment:</span>
                <Badge variant={currentEnvironmentConfig?.isConfigured ? "default" : "destructive"}>
                  {selectedEnv}
                  {!currentEnvironmentConfig?.isConfigured && " (Not configured)"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {tests.map(t => (
                <div key={t.id} className="flex flex-col border p-3 rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-start">
                      <Checkbox
                        checked={t.selected}
                        className="mt-1 border-white data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        onCheckedChange={() =>
                          setTests(s =>
                            s.map(x => x.id === t.id ? { ...x, selected: !x.selected } : x)
                          )
                        }
                      />
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.suite}</div>
                        {t.description && (
                          <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                        )}
                        {t.customTemplates && (
                          <div className="text-xs text-green-600 mt-1">Custom templates configured</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(t.id.includes("cable") || t.id.includes("mobile") || t.id.includes("dsl") || t.id === "get-order" || t.id === "get-documents" || t.id === "search-customer" || t.id === "legacy-search") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openConfigureModal(t.id)}
                          title="Configure request templates"
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      )}
                      <StatusIcon status={t.status} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Side */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent>
            <Button
              className="w-full"
              disabled={isRunning || selectedTests.length === 0}
              onClick={runSelected}
            >
              Run selected tests
            </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Run Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Summary label="Selected" value={selectedTests.length} />
              <Summary label="Passed" value={passed} />
              <Summary label="Failed" value={failed} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button 
                onClick={runBasicSanity}
                disabled={isRunning}
              >
                {isRunning ? "Running..." : `Run Basic Sanity (${selectedEnv})`}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => window.open(`/logs?env=${selectedEnv}`, "_blank")}
              >
                View Logs ({selectedEnv})
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsScheduleModalOpen(true)} 
              >
                Schedule Sanity
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsTimelineOpen(true)} 
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Auto Sanity Timeline
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/sanity-reports")}
              >
                Sanity Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Progress Tracker */}
      {isRunning && currentRunningTest && (
        <Card className="mt-6 border-blue-500/50 bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-300">
                    Running Basic Sanity on {selectedEnv}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {runProgress.current} / {runProgress.total} tests
                  </span>
                </div>
                <Progress 
                  value={runProgress.total > 0 ? (runProgress.current / runProgress.total) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-8">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm font-medium">
                Currently running: <span className="text-blue-400">{currentRunningTest}</span>
              </span>
            </div>
            {completedTestIds.length > 0 && (
              <div className="mt-3 px-8 space-y-1">
                <span className="text-xs text-muted-foreground">Completed:</span>
                <div className="flex flex-wrap gap-2">
                  {completedTestIds.map(id => {
                    const test = tests.find(t => t.id === id)
                    const status = test?.status
                    return (
                      <Badge 
                        key={id} 
                        variant={status === "passed" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {status === "passed" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {test?.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Results Panel */}
      {testResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Execution Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result) => (
              <div key={result.testId + result.timestamp} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedResult(expandedResult === result.testId ? null : result.testId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted text-left"
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{result.testName}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.environment} - {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "PASSED" : "FAILED"}
                  </Badge>
                </button>

                {expandedResult === result.testId && (
                  <div className="border-t p-4 bg-muted/50 space-y-3">
                    {result.error && (
                      <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
                        Error: {result.error}
                      </div>
                    )}

                    {result.steps.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Steps:</div>
                        {result.steps.map((step, idx) => (
                          <div key={idx} className="border rounded bg-background">
                            <button
                              onClick={() => setExpandedStep(expandedStep === `${result.testId}-${idx}` ? null : `${result.testId}-${idx}`)}
                              className="w-full flex items-center justify-between p-3 hover:bg-muted text-left"
                            >
                              <div className="flex items-center gap-2">
                                {step.status === "PASS" ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium">{step.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{step.message}</span>
                            </button>

                            {expandedStep === `${result.testId}-${idx}` && (
                              <div className="border-t p-3 space-y-3">
                                {step.request && (
                                  <div>
                                    <div className="text-xs font-medium mb-1 text-muted-foreground">REQUEST:</div>
                                    <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-auto max-h-60">
                                      {step.request}
                                    </pre>
                                  </div>
                                )}
                                {step.response && (
                                  <div>
                                    <div className="text-xs font-medium mb-1 text-muted-foreground">RESPONSE:</div>
                                    <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-auto max-h-60">
                                      {step.response}
                                    </pre>
                                  </div>
                                )}
                                {!step.request && !step.response && (
                                  <div className="text-sm text-muted-foreground">No request/response data available</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {result.steps.length === 0 && !result.error && (
                      <div className="text-sm text-muted-foreground">No step details available</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Configure Test Modal */}
      {configureTestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-lg p-6 w-[90vw] max-w-4xl max-h-[90vh] overflow-auto">
            <h4 className="text-lg font-semibold mb-2">
              Configure Request Templates
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Edit the SOAP XML templates for each step. Use placeholders:
              <code className="mx-1 px-1 bg-muted rounded">{"{{ORDER_ID}}"}</code>
              <code className="mx-1 px-1 bg-muted rounded">{"{{OGW_ORDER_ID}}"}</code>
            </p>

            <div className="space-y-4">
              {Object.entries(editingTemplates).map(([stepName, template]) => (
                <div key={stepName} className="space-y-2">
                  <label className="text-sm font-medium">{stepName}</label>
                  <textarea
                    value={template}
                    onChange={(e) => setEditingTemplates(prev => ({
                      ...prev,
                      [stepName]: e.target.value
                    }))}
                    className="w-full h-48 font-mono text-xs border rounded p-3 bg-black text-green-400"
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfigureTestId(null)
                  setEditingTemplates({})
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveTestTemplates}>
                Save Templates
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Sanity Timeline Modal */}
      {isTimelineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-lg p-6 w-[90vw] max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-pink-500" />
                <h4 className="text-lg font-semibold">Auto Sanity Timeline</h4>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsTimelineOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              All scheduled sanities across environments.
            </p>
            <ScheduledSanitiesList />
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96 text-black">
            <h4 className="text-lg font-semibold mb-4">Schedule Sanity</h4>
            <p className="text-sm text-gray-600 mb-4">
              Environment: <span className="font-semibold">{selectedEnv}</span>
            </p>

            <div className="space-y-2">
              <label className="flex flex-col">
                Sanity Type:
                <select
                  value={scheduleType}
                  onChange={e => setScheduleType(e.target.value as "basic")}
                  className="border px-2 py-1 rounded"
                >
                  <option value="basic">Basic Sanity</option>
                </select>
              </label>

              <label className="flex flex-col">
                Date:
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="border px-2 py-1 rounded"
                />
              </label>

              <label className="flex flex-col">
                Time:
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="border px-2 py-1 rounded"
                />
              </label>

              <label className="flex flex-col">
                Recurrence:
                <select
                  value={recurrence}
                  onChange={e => setRecurrence(e.target.value as "daily" | "weekly" | "monthly")}
                  className="border px-2 py-1 rounded"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={scheduleSanity}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Schedule
              </button>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <Badge>{value}</Badge>
    </div>
  )
}

function StatusIcon({ status }: { status: TestCase["status"] }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin" />
  if (status === "passed") return <CheckCircle className="h-4 w-4 text-green-500" />
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />
  return <Clock className="h-4 w-4 text-muted-foreground" />
}

interface ScheduledSanity {
  id: string
  type: string
  environment: string
  date: string
  time: string
  recurrence: string
  createdAt: string
  isActive: boolean
}

function ScheduledSanitiesList() {
  const [items, setItems] = useState<ScheduledSanity[]>([])

  useEffect(() => {
    const raw = localStorage.getItem("scheduledSanities")
    if (raw) {
      setItems(JSON.parse(raw))
    }
  }, [])

  function removeSchedule(id: string) {
    const updated = items.filter(item => item.id !== id)
    setItems(updated)
    localStorage.setItem("scheduledSanities", JSON.stringify(updated))
  }

  function toggleActive(id: string) {
    const updated = items.map(item => 
      item.id === id ? { ...item, isActive: !item.isActive } : item
    )
    setItems(updated)
    localStorage.setItem("scheduledSanities", JSON.stringify(updated))
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No scheduled sanities yet.</p>
        <p className="text-xs mt-1">Use the Schedule Sanity button to create one.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div 
          key={item.id} 
          className={`flex items-center justify-between border rounded-lg p-4 ${
            item.isActive ? "border-pink-500/30 bg-pink-500/5" : "opacity-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.isActive ? "bg-pink-500" : "bg-muted-foreground"}`} />
            <div>
              <div className="text-sm font-medium">
                {item.type.toUpperCase()} Sanity
              </div>
              <div className="text-xs text-muted-foreground">
                {item.environment} &mdash; {item.date} at {item.time}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Recurrence: <span className="capitalize">{item.recurrence}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={item.isActive ? "default" : "secondary"} 
              className={`cursor-pointer text-xs ${item.isActive ? "bg-pink-500 hover:bg-pink-600" : ""}`}
              onClick={() => toggleActive(item.id)}
            >
              {item.isActive ? "Active" : "Paused"}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => removeSchedule(item.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
