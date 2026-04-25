param([Parameter(ValueFromRemainingArguments = $true)][string[]]$mvnArgs)
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmdWrapper = Join-Path $scriptDir 'mvnw.cmd'

if (!(Test-Path $cmdWrapper)) {
	throw "Wrapper command not found at $cmdWrapper"
}

& $cmdWrapper @mvnArgs
exit $LASTEXITCODE
