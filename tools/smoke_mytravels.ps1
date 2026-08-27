$ErrorActionPreference = 'SilentlyContinue'
$port = 9333 + (Get-Random -Maximum 100)
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$userData = Join-Path $env:TEMP 'gm-chrome-profile-' + (Get-Random)
New-Item -ItemType Directory -Path $userData -Force | Out-Null

$proc = Start-Process -FilePath $chrome -ArgumentList @(
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=' + $port,
  '--user-data-dir=' + $userData
) -PassThru

Start-Sleep -Seconds 3

$tabs = Invoke-RestMethod "http://localhost:$port/json" -ErrorAction SilentlyContinue
$wsUrl = ($tabs | Where-Object { $_.type -eq 'page' } | Select-Object -First 1).webSocketDebuggerUrl
if (-not $wsUrl) { Write-Host 'NO_WS'; Stop-Process -Id $proc.Id -Force; exit 1 }

Add-Type -AssemblyName System.Net.WebSockets
Add-Type -AssemblyName System.Text

$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource
$ws.ConnectAsync([Uri]$wsUrl, $cts.Token).GetAwaiter().GetResult() | Out-Null

function Send-Cdp($msg) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
  $seg = New-Object System.ArraySegment[byte] (, $bytes)
  $ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).GetAwaiter().GetResult() | Out-Null
}

function Read-Cdp {
  $buf = New-Object byte[] 65536
  $seg = New-Object System.ArraySegment[byte] (, $buf)
  $res = $ws.ReceiveAsync($seg, $cts.Token).GetAwaiter().GetResult()
  return [System.Text.Encoding]::UTF8.GetString($buf, 0, $res.Count)
}

Send-Cdp '{"id":1,"method":"Page.enable"}'
Send-Cdp '{"id":2,"method":"Runtime.enable"}'
$null = Read-Cdp
$null = Read-Cdp

Send-Cdp '{"id":10,"method":"Page.navigate","params":{"url":"http://localhost:3000/my-travels"}}'
Start-Sleep -Seconds 6

$js = 'JSON.stringify({title:document.title, url:window.location.href, body:document.body && document.body.innerText.substring(0,800), cards:document.querySelectorAll(".gm-mt-card").length, chips:document.querySelectorAll(".gm-mt-chip").length, stats:document.querySelectorAll(".gm-mt-stat").length, head:!!document.querySelector(".gm-mt__head"), empty:!!document.querySelector(".gm-mt-empty")})'
$payload = '{"id":99,"method":"Runtime.evaluate","params":{"expression":' + ($js | ConvertTo-Json -Compress) + ',"returnByValue":true}}'
Send-Cdp $payload
$resp = Read-Cdp
Write-Host "===PAGE==="
Write-Host $resp

$ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'bye', $cts.Token).GetAwaiter().GetResult() | Out-Null
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
