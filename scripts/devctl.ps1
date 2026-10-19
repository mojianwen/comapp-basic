# ============================================================
#  devctl.ps1 - stop dev processes that belong to this repo
#
#  Two modes:
#    (default)   kill every vite / tsx process of this repo (tree kill)
#    -StaleOnly  kill only those NOT holding port 5219 / 3000
#                (a watcher whose child is still listening is kept)
#
#  Why: npm run dev spawns  watcher(npm/tsx/vite) -> child(server).
#  Killing only the port owner leaves the watcher alive, and the
#  next start creates a duplicate.
# ============================================================
param([switch]$StaleOnly)

$ErrorActionPreference = 'SilentlyContinue'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$ports = @(5219, 3000)

function Get-ListenPids {
    $list = @()
    foreach ($p in $ports) {
        $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) { $list += [int]$c.OwningProcess }
    }
    return $list
}

function Get-DescendantIds([int]$parentId) {
    $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId
    $ids = New-Object System.Collections.Generic.List[int]
    $queue = New-Object System.Collections.Generic.Queue[int]
    $queue.Enqueue($parentId)
    while ($queue.Count -gt 0) {
        $cur = $queue.Dequeue()
        foreach ($child in ($all | Where-Object { $_.ParentProcessId -eq $cur })) {
            $cid = [int]$child.ProcessId
            $ids.Add($cid)
            $queue.Enqueue($cid)
        }
    }
    return $ids
}

$listenPids = Get-ListenPids

$targets = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
    $_.CommandLine -and
    $_.CommandLine.Contains($root) -and
    ($_.CommandLine -match 'vite[\\/]bin[\\/]vite\.js' -or $_.CommandLine -match 'tsx[\\/]dist[\\/]cli\.mjs')
}

if (-not $targets) {
    if (-not $StaleOnly) { Write-Host '[MoAdmin] No dev process found. Nothing to do.' }
    exit 0
}

$killed = 0
foreach ($p in $targets) {
    $pidValue = [int]$p.ProcessId

    if ($StaleOnly) {
        $tree = @($pidValue) + @(Get-DescendantIds $pidValue)
        $alive = $false
        foreach ($t in $tree) { if ($listenPids -contains $t) { $alive = $true; break } }
        if ($alive) { continue }
        Write-Host ("[MoAdmin] Stale watcher PID " + $pidValue + " removed")
    }
    else {
        Write-Host ("[MoAdmin] Stopping PID " + $pidValue + " ...")
    }

    & taskkill /F /T /PID $pidValue 2>&1 | Out-Null
    $killed = $killed + 1
}

Start-Sleep -Milliseconds 600

# Fallback: anything still holding the ports.
# Only in full-stop mode - in -StaleOnly mode a listening port is a healthy service.
if (-not $StaleOnly) {
    foreach ($port in $ports) {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            Write-Host ("[MoAdmin] Port " + $port + " still held by PID " + $c.OwningProcess + ", stopping ...")
            & taskkill /F /T /PID $c.OwningProcess 2>&1 | Out-Null
            $killed = $killed + 1
        }
    }
}

if (-not $StaleOnly) {
    if ($killed -eq 0) { Write-Host '[MoAdmin] Nothing to stop.' }
    else { Write-Host ('[MoAdmin] Servers stopped (' + $killed + ' process tree(s)).') }
}
exit 0
