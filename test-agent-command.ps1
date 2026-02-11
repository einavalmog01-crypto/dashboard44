# Test script to actually run the agent command
Write-Host "=== Testing Agent Command Execution ===" -ForegroundColor Cyan

# First, try to load the PowerShell profile if it exists
if (Test-Path $PROFILE) {
    Write-Host "Loading PowerShell profile..." -ForegroundColor Yellow
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
} else {
    Write-Host "Agent command still not found after loading profile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Attempting to find and use Cursor CLI directly..." -ForegroundColor Yellow
    
    # Try using Cursor.exe with agent subcommand
    $cursorExe = "C:\Program Files\cursor\Cursor.exe"
    if (Test-Path $cursorExe) {
        Write-Host "Found Cursor at: $cursorExe" -ForegroundColor Green
        Write-Host ""
        Write-Host "Note: The 'agent' command needs to be set up in your PowerShell profile." -ForegroundColor Yellow
        Write-Host "You may need to install the Cursor CLI agent command first." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To set up the agent command, you typically need to:" -ForegroundColor Cyan
        Write-Host "1. Install Cursor CLI tools" -ForegroundColor White
        Write-Host "2. Add the agent command to your PowerShell profile" -ForegroundColor White
        Write-Host "3. The profile path is: $PROFILE" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

