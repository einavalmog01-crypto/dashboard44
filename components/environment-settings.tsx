"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  X,
  Database,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Server,
  User,
  Lock,
  Save,
  Globe,
  Terminal,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type {
  EnvironmentConfig,
  Environment,
  DbConfig,
  AuthConfig,
  EndpointConfig,
  UnixConfig,
} from "@/lib/environment-config"
import { isEnvironmentConfigured } from "@/lib/environment-config"

interface EnvironmentSettingsProps {
  isOpen: boolean
  onClose: () => void
  environments: EnvironmentConfig[]
  onSave: (configs: EnvironmentConfig[]) => void
}

type ConnectionSection = "db" | "auth" | "endpoint" | "unix"

export function EnvironmentSettings({ isOpen, onClose, environments, onSave }: EnvironmentSettingsProps) {
  const [configs, setConfigs] = useState<EnvironmentConfig[]>(environments)
  const [activeTab, setActiveTab] = useState<Environment>("CRs")
  const [activeSection, setActiveSection] = useState<ConnectionSection>("db")
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [testingConnection, setTestingConnection] = useState<{ env: Environment; section: ConnectionSection } | null>(
    null,
  )
  const [connectionStatus, setConnectionStatus] = useState<Record<string, "success" | "error" | null>>({})
const router = useRouter()

  if (!isOpen) return null

  const updateDbConfig = (envName: Environment, field: keyof DbConfig, value: string) => {
    setConfigs((prev) => prev.map((c) => (c.name === envName ? { ...c, db: { ...c.db, [field]: value } } : c)))
    setConnectionStatus((prev) => ({ ...prev, [`${envName}-db`]: null }))
  }

  const updateAuthConfig = (envName: Environment, field: keyof AuthConfig, value: string) => {
    setConfigs((prev) => prev.map((c) => (c.name === envName ? { ...c, auth: { ...c.auth, [field]: value } } : c)))
    setConnectionStatus((prev) => ({ ...prev, [`${envName}-auth`]: null }))
  }

  const updateEndpointConfig = (envName: Environment, field: keyof EndpointConfig, value: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.name === envName ? { ...c, endpoint: { ...c.endpoint, [field]: value } } : c)),
    )
    setConnectionStatus((prev) => ({ ...prev, [`${envName}-endpoint`]: null }))
  }

  const updateUnixConfig = (envName: Environment, field: keyof UnixConfig, value: string) => {
    setConfigs((prev) => prev.map((c) => (c.name === envName ? { ...c, unix: { ...c.unix, [field]: value } } : c)))
    setConnectionStatus((prev) => ({ ...prev, [`${envName}-unix`]: null }))
  }

  const togglePassword = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const testConnection = async (envName: Environment, section: ConnectionSection) => {
    setTestingConnection({ env: envName, section })
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const config = configs.find((c) => c.name === envName)
    let isValid = false

    if (config) {
      switch (section) {
        case "db":
          isValid = !!(
            config.db.hostname &&
            config.db.username &&
            config.db.password &&
            (config.db.sid || config.db.serviceName)
          )
          break
        case "auth":
          isValid = !!(config.auth.username && config.auth.password)
          break
        case "endpoint":
          isValid = !!config.endpoint.host
          break
        case "unix":
          isValid = !!(config.unix.hostName && config.unix.userName && config.unix.password)
          break
      }
    }

    setConnectionStatus((prev) => ({ ...prev, [`${envName}-${section}`]: isValid ? "success" : "error" }))
    setTestingConnection(null)
  }

  const handleSave = () => {
    const updatedConfigs = configs.map((c) => ({
      ...c,
      isConfigured: isEnvironmentConfigured(c),
    }))
    onSave(updatedConfigs)
    onClose()
  }

const handleCancel = () => {
  setConfigs(environments) // discard changes
  router.push("/")          // navigate to the main page
}

  const getConfig = (envName: Environment) => configs.find((c) => c.name === envName)!

  const sectionTabs = [
    { id: "db" as const, label: "Database", icon: Database },
    { id: "auth" as const, label: "Auth", icon: KeyRound },
    { id: "endpoint" as const, label: "Endpoint", icon: Globe },
    { id: "unix" as const, label: "UNIX", icon: Terminal },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
<div
  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
/>
      <div className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Environment Settings</h2>
              <p className="text-xs text-muted-foreground">Configure connections for each environment</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Environment)}>
            {/* Environment tabs */}
            <TabsList className="grid grid-cols-6 w-full bg-secondary/50 mb-4">
              {configs.map((env) => (
                <TabsTrigger key={env.name} value={env.name} className="relative data-[state=active]:bg-primary/20">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${env.color}`} />
                    <span className="text-xs">{env.name}</span>
                  </div>
                  {env.isConfigured && <CheckCircle2 className="h-3 w-3 text-neon-green absolute -top-1 -right-1" />}
                </TabsTrigger>
              ))}
            </TabsList>

            {configs.map((env) => (
              <TabsContent key={env.name} value={env.name} className="space-y-4">
                {/* Connection type tabs */}
                <div className="flex gap-2 border-b border-border pb-2">
                  {sectionTabs.map((section) => (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveSection(section.id)}
                      className={activeSection === section.id ? "bg-primary/20 text-primary" : ""}
                    >
                      <section.icon className="h-4 w-4 mr-1.5" />
                      {section.label}
                      {connectionStatus[`${env.name}-${section.id}`] === "success" && (
                        <CheckCircle2 className="h-3 w-3 text-neon-green ml-1.5" />
                      )}
                    </Button>
                  ))}
                </div>

                {/* Database Section */}
                {activeSection === "db" && (
                  <Card className="bg-secondary/30 border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-primary" />
                          <CardTitle className="text-base">Database Connection</CardTitle>
                        </div>
                        {connectionStatus[`${env.name}-db`] === "success" && (
                          <span className="flex items-center gap-1 text-xs text-neon-green">
                            <CheckCircle2 className="h-3 w-3" /> Connected
                          </span>
                        )}
                        {connectionStatus[`${env.name}-db`] === "error" && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Connection Failed
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs">Oracle database connection details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Server className="h-3 w-3 text-muted-foreground" />
                            Hostname
                          </Label>
                          <Input
                            placeholder="e.g., db.example.com"
                            value={getConfig(env.name).db.hostname}
                            onChange={(e) => updateDbConfig(env.name, "hostname", e.target.value)}
                            className="bg-background/50 border-border text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Server className="h-3 w-3 text-muted-foreground" />
                            Port
                          </Label>
                          <Input
                            placeholder="1521"
                            value={getConfig(env.name).db.port}
                            onChange={(e) => updateDbConfig(env.name, "port", e.target.value)}
                            className="bg-background/50 border-border text-sm"
                          />
                        </div>
                      </div>

                      {/* SID or Service Name selection */}
                      <div className="space-y-3">
                        <Label className="text-xs">Connection Type (choose one)</Label>
                        <RadioGroup
                          value={getConfig(env.name).db.connectionType}
                          onValueChange={(v) => updateDbConfig(env.name, "connectionType", v)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sid" id={`${env.name}-sid-radio`} />
                            <Label htmlFor={`${env.name}-sid-radio`} className="text-xs">
                              SID
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="serviceName" id={`${env.name}-service-radio`} />
                            <Label htmlFor={`${env.name}-service-radio`} className="text-xs">
                              Service Name
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Database className="h-3 w-3 text-muted-foreground" />
                            SID
                          </Label>
                          <Input
                            placeholder="e.g., ORCL"
                            value={getConfig(env.name).db.sid}
                            onChange={(e) => updateDbConfig(env.name, "sid", e.target.value)}
                            disabled={getConfig(env.name).db.connectionType !== "sid"}
                            className="bg-background/50 border-border text-sm disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Database className="h-3 w-3 text-muted-foreground" />
                            Service Name
                          </Label>
                          <Input
                            placeholder="e.g., service.example.com"
                            value={getConfig(env.name).db.serviceName}
                            onChange={(e) => updateDbConfig(env.name, "serviceName", e.target.value)}
                            disabled={getConfig(env.name).db.connectionType !== "serviceName"}
                            className="bg-background/50 border-border text-sm disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground" />
                            Username
                          </Label>
                          <Input
                            placeholder="Enter username"
                            value={getConfig(env.name).db.username}
                            onChange={(e) => updateDbConfig(env.name, "username", e.target.value)}
                            className="bg-background/50 border-border text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              type={showPasswords[`${env.name}-db`] ? "text" : "password"}
                              placeholder="Enter password"
                              value={getConfig(env.name).db.password}
                              onChange={(e) => updateDbConfig(env.name, "password", e.target.value)}
                              className="bg-background/50 border-border text-sm pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => togglePassword(`${env.name}-db`)}
                            >
                              {showPasswords[`${env.name}-db`] ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(env.name, "db")}
                        disabled={testingConnection?.env === env.name && testingConnection?.section === "db"}
                        className="w-full"
                      >
                        {testingConnection?.env === env.name && testingConnection?.section === "db" ? (
                          <>
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                            Testing Connection...
                          </>
                        ) : (
                          <>
                            <Database className="h-4 w-4 mr-2" />
                            Test DB Connection
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Auth Section */}
                {activeSection === "auth" && (
                  <Card className="bg-secondary/30 border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-primary" />
                          <CardTitle className="text-base">Authentication</CardTitle>
                        </div>
                        {connectionStatus[`${env.name}-auth`] === "success" && (
                          <span className="flex items-center gap-1 text-xs text-neon-green">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </span>
                        )}
                        {connectionStatus[`${env.name}-auth`] === "error" && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Invalid Credentials
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs">Authentication credentials for API calls</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground" />
                            Username
                          </Label>
                          <Input
                            placeholder="Enter username"
                            value={getConfig(env.name).auth.username}
                            onChange={(e) => updateAuthConfig(env.name, "username", e.target.value)}
                            className="bg-background/50 border-border text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              type={showPasswords[`${env.name}-auth`] ? "text" : "password"}
                              placeholder="Enter password"
                              value={getConfig(env.name).auth.password}
                              onChange={(e) => updateAuthConfig(env.name, "password", e.target.value)}
                              className="bg-background/50 border-border text-sm pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => togglePassword(`${env.name}-auth`)}
                            >
                              {showPasswords[`${env.name}-auth`] ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(env.name, "auth")}
                        disabled={testingConnection?.env === env.name && testingConnection?.section === "auth"}
                        className="w-full"
                      >
                        {testingConnection?.env === env.name && testingConnection?.section === "auth" ? (
                          <>
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Verify Credentials
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Endpoint Section */}
                {activeSection === "endpoint" && (
                  <Card className="bg-secondary/30 border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <CardTitle className="text-base">Endpoint Host</CardTitle>
                        </div>
                        {connectionStatus[`${env.name}-endpoint`] === "success" && (
                          <span className="flex items-center gap-1 text-xs text-neon-green">
                            <CheckCircle2 className="h-3 w-3" /> Reachable
                          </span>
                        )}
                        {connectionStatus[`${env.name}-endpoint`] === "error" && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Unreachable
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs">API endpoint URL for this environment</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          Host URL
                        </Label>
                        <Input
                          placeholder="e.g., https://illinomcfrc01.corp.amdocs.com:16501"
                          value={getConfig(env.name).endpoint.host}
                          onChange={(e) => updateEndpointConfig(env.name, "host", e.target.value)}
                          className="bg-background/50 border-border text-sm"
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(env.name, "endpoint")}
                        disabled={testingConnection?.env === env.name && testingConnection?.section === "endpoint"}
                        className="w-full"
                      >
                        {testingConnection?.env === env.name && testingConnection?.section === "endpoint" ? (
                          <>
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                            Testing Endpoint...
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 mr-2" />
                            Test Endpoint
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* UNIX Section */}
                {activeSection === "unix" && (
                  <Card className="bg-secondary/30 border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-primary" />
                          <CardTitle className="text-base">UNIX Connection</CardTitle>
                        </div>
                        {connectionStatus[`${env.name}-unix`] === "success" && (
                          <span className="flex items-center gap-1 text-xs text-neon-green">
                            <CheckCircle2 className="h-3 w-3" /> Connected
                          </span>
                        )}
                        {connectionStatus[`${env.name}-unix`] === "error" && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Connection Failed
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs">SSH/UNIX server connection details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Server className="h-3 w-3 text-muted-foreground" />
                            Host Name
                          </Label>
                          <Input
                            placeholder="e.g., unix.example.com"
                            value={getConfig(env.name).unix.hostName}
                            onChange={(e) => updateUnixConfig(env.name, "hostName", e.target.value)}
                            className="bg-background/50 border-border text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Server className="h-3 w-3 text-muted-foreground" />
                            Port Number
                          </Label>
                          <Input
                            placeholder="22"
                            value={getConfig(env.name).unix.port}
                            onChange={(e) => updateUnixConfig(env.name, "port", e.target.value)}
                            className="bg-background/50 border-border text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground" />
                            User Name
                          </Label>
                          <Input
                            placeholder="Enter username"
                            value={getConfig(env.name).unix.userName}
                            onChange={(e) => updateUnixConfig(env.name, "userName", e.target.value)}
                            className="bg-background/50 border-border text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              type={showPasswords[`${env.name}-unix`] ? "text" : "password"}
                              placeholder="Enter password"
                              value={getConfig(env.name).unix.password}
                              onChange={(e) => updateUnixConfig(env.name, "password", e.target.value)}
                              className="bg-background/50 border-border text-sm pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => togglePassword(`${env.name}-unix`)}
                            >
                              {showPasswords[`${env.name}-unix`] ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(env.name, "unix")}
                        disabled={testingConnection?.env === env.name && testingConnection?.section === "unix"}
                        className="w-full"
                      >
                        {testingConnection?.env === env.name && testingConnection?.section === "unix" ? (
                          <>
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                            Testing SSH...
                          </>
                        ) : (
                          <>
                            <Terminal className="h-4 w-4 mr-2" />
                            Test UNIX Connection
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

       <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/50">
  <div className="text-xs text-muted-foreground">
    {configs.filter((c) => isEnvironmentConfigured(c)).length} of {configs.length} environments configured
  </div>
<div className="flex gap-2">
  <Button variant="outline" onClick={handleCancel}>
    Cancel
  </Button>
    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
      <Save className="h-4 w-4 mr-2" />
      Save Settings
    </Button>
  </div>
</div>
      </div> 
    </div>
  )
}


