@echo off
title Stock Pattern Detection System - Local Deployment
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-local.ps1" %*
pause
