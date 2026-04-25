@echo off
setlocal
set DIR=%~dp0
if "%DIR:~-1%"=="\" set "DIR=%DIR:~0,-1%"
set "MAVEN_HOME=%DIR%\.mvn\apache-maven-3.9.9"
set "MAVEN_ZIP=%DIR%\.mvn\wrapper\apache-maven-3.9.9-bin.zip"

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  if not exist "%MAVEN_ZIP%" (
    echo Maven archive not found at "%MAVEN_ZIP%"
    exit /b 1
  )
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%DIR%\.mvn' -Force" >nul
)

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  echo Failed to prepare local Maven at "%MAVEN_HOME%"
  exit /b 1
)

call "%MAVEN_HOME%\bin\mvn.cmd" %*
endlocal
