# Test script to check agent command availability
Write-Host "=== Testing Cursor CLI Agent ===" -ForegroundColor Cyan

# Check if agent command exists
Write-Host ""
Write-Host "1. Checking if 'agent' command is in PATH..." -ForegroundColor Yellow
$agentCmd = Get-Command agent -ErrorAction SilentlyContinue
if ($agentCmd) {
    Write-Host "   Found: $($agentCmd.Source)" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. Testing agent command..." -ForegroundColor Yellow
    try {
        agent --help
    } catch {
        Write-Host "   Error running agent: $_" -ForegroundColor Red
    }
} else {
    Write-Host "   'agent' command not found in PATH" -ForegroundColor Red
    
    # Check PowerShell profile
    Write-Host ""
    Write-Host "2. Checking PowerShell profile..." -ForegroundColor Yellow
    if (Test-Path $PROFILE) {
        Write-Host "   Profile exists: $PROFILE" -ForegroundColor Green
        $profileContent = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
        if ($profileContent -and $profileContent -match 'agent') {
            Write-Host "   Profile contains 'agent' reference" -ForegroundColor Green
            Write-Host "   Profile content (agent-related):" -ForegroundColor Gray
            Get-Content $PROFILE | Select-String -Pattern 'agent' -Context 2
        } else {
            Write-Host "   Profile does not contain 'agent' reference" -ForegroundColor Red
        }
    } else {
        Write-Host "   No PowerShell profile found at: $PROFILE" -ForegroundColor Red
    }
    
    # Check Cursor installation
    Write-Host ""
    Write-Host "3. Checking Cursor installation..." -ForegroundColor Yellow
    $cursorPath1 = "C:\Program Files\cursor\Cursor.exe"
    $cursorPath2 = "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe"
    
    if (Test-Path $cursorPath1) {
        Write-Host "   Found: $cursorPath1" -ForegroundColor Green
    } else {
        Write-Host "   Not found: $cursorPath1" -ForegroundColor Gray
    }
    
    if (Test-Path $cursorPath2) {
        Write-Host "   Found: $cursorPath2" -ForegroundColor Green
    } else {
        Write-Host "   Not found: $cursorPath2" -ForegroundColor Gray
    }
    
    # Try to find agent in common locations
    Write-Host ""
    Write-Host "4. Searching for agent executable..." -ForegroundColor Yellow
    $searchPaths = @(
        "$env:USERPROFILE\.cursor",
        "$env:LOCALAPPDATA\cursor",
        "$env:APPDATA\cursor",
        "C:\Program Files\cursor",
        "$env:LOCALAPPDATA\Programs\cursor"
    )
    
    foreach ($searchPath in $searchPaths) {
        if (Test-Path $searchPath) {
            Write-Host "   Checking: $searchPath" -ForegroundColor Gray
            $agentFiles = Get-ChildItem -Path $searchPath -Filter "*agent*" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 5
            if ($agentFiles) {
                foreach ($file in $agentFiles) {
                    Write-Host "     Found: $($file.FullName)" -ForegroundColor Green
                }
            }
        }
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
