# Rename Project Script
# This script helps you rename the Staco project to your own project name.

param (
    [string]$NewName
)

# Function to prompt for input if not provided
function Get-ProjectName {
    param($Name)
    if ([string]::IsNullOrWhiteSpace($Name)) {
        return Read-Host "Enter your new project name (e.g., MyAwesomeApp)"
    }
    return $Name
}

# Determine Project Root (Parent of the scripts folder)
$ProjectRoot = Split-Path -Parent $PSScriptRoot

# Verify we are in the right place
if (-not (Test-Path (Join-Path $ProjectRoot "index.html"))) {
    Write-Host "Error: Could not find index.html in '$ProjectRoot'." -ForegroundColor Red
    Write-Host "Make sure this script is in the 'scripts' folder of your project." -ForegroundColor Yellow
    exit 1
}

$NewName = Get-ProjectName -Name $NewName

if ([string]::IsNullOrWhiteSpace($NewName)) {
    Write-Host "Project name cannot be empty." -ForegroundColor Red
    exit 1
}

Write-Host "Renaming project to '$NewName'..." -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot" -ForegroundColor DarkGray

# 1. Update index.html Title
$IndexPath = Join-Path $ProjectRoot "index.html"
if (Test-Path $IndexPath) {
    $Content = Get-Content $IndexPath -Raw
    # Regex to replace <title>Staco...</title>
    $NewContent = $Content -replace '<title>.*?</title>', "<title>$NewName</title>"
    Set-Content $IndexPath $NewContent -Encoding UTF8
    Write-Host "Updated index.html title." -ForegroundColor Green
}
else {
    Write-Host "Warning: index.html not found." -ForegroundColor Yellow
}

# 2. Update config/base-path.js
$BasePathFile = Join-Path $ProjectRoot "config\base-path.js"
if (Test-Path $BasePathFile) {
    $Content = Get-Content $BasePathFile -Raw
    
    # Replace /Staco/ with /$NewName/
    # Using regex to be safe against multiple runs or variations
    if ($Content -match "/Staco/") {
        $NewContent = $Content.Replace("/Staco/", "/$NewName/")
        Set-Content $BasePathFile $NewContent -Encoding UTF8
        Write-Host "Updated config/base-path.js base path." -ForegroundColor Green
    }
    else {
        Write-Host "config/base-path.js does not contain '/Staco/', skipping." -ForegroundColor Yellow
    }
}
else {
    Write-Host "Warning: config/base-path.js not found." -ForegroundColor Yellow
}

# 3. Update README.md Title
$ReadmePath = Join-Path $ProjectRoot "README.md"
if (Test-Path $ReadmePath) {
    $Content = Get-Content $ReadmePath -Raw
    if ($Content -match "^# Staco") {
        $NewContent = $Content -replace "^# Staco", "# $NewName"
        Set-Content $ReadmePath $NewContent -Encoding UTF8
        Write-Host "Updated README.md title." -ForegroundColor Green
    }
}

Write-Host "`nProject renamed successfully to '$NewName'!" -ForegroundColor Cyan
Write-Host "Next steps:"
Write-Host "1. Rename the root folder: Rename-Item '$ProjectRoot' '$NewName'"
Write-Host "2. Update your git remote if needed."
