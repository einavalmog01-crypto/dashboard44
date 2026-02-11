# Script to install Cursor CLI and test the agent command
Write-Host "=== Installing Cursor CLI ===" -ForegroundColor Cyan

# Install Cursor CLI
Write-Host "Running installation command..." -ForegroundColor Yellow
try {
    irm 'https://cursor.com/install?win32=true' | iex
    Write-Host "Installation completed!" -ForegroundColor Green
} catch {
    Write-Host "Installation error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Testing Agent Command ===" -ForegroundColor Cyan

# Reload profile to get the agent command
if (Test-Path $PROFILE) {
    Write-Host "Reloading PowerShell profile..." -ForegroundColor Yellow
    . $PROFILE
}

# Check if agent is now available
$agentCmd = Get-Command agent -ErrorAction SilentlyContinue
if ($agentCmd) {
    Write-Host "Agent command found: $($agentCmd.Source)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing: agent --help" -ForegroundColor Yellow
    Write-Host "---" -ForegroundColor Gray
    agent --help
    Write-Host "---" -ForegroundColor Gray
    Write-Host ""
    Write-Host "SUCCESS! The agent command is now available." -ForegroundColor Green
} else {
    Write-Host "Agent command still not found. You may need to:" -ForegroundColor Yellow
    Write-Host "1. Restart your PowerShell terminal" -ForegroundColor White
    Write-Host "2. Or manually reload your profile: . `$PROFILE" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Cyan

