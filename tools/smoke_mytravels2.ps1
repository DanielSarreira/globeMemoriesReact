$ErrorActionPreference = 'Continue'
$port = 9333
$wsUrl = 'ws://127.0.0.1:9333/devtools/page/40FAD1296609BCD32EA4F674D75D17CA'

Add-Type -AssemblyName System.Net.WebSockets
Add-Type -AssemblyName System.Text

$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource
$ws.ConnectAsync([Uri]$wsUrl, $cts.Token).GetAwaiter().GetResult() | Out-Null

function Send-Cdp($id, $method, $paramsJson) {
  $msg = '{"id":' + $id + ',"method":"' + $method + '"' + $(if ($paramsJson) { ',"params":' + $paramsJson } else { '' }) + '}'
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

Send-Cdp 1 'Page.enable' $null
Send-Cdp 2 'Runtime.enable' $null
Send-Cdp 3 'Log.enable' $null
$null = Read-Cdp
$null = Read-Cdp
$null = Read-Cdp

# Navigate
Send-Cdp 10 'Page.navigate' '{"url":"http://localhost:3000/my-travels"}'

# Wait for load
Start-Sleep -Seconds 7

# Evaluate
$js = "JSON.stringify({title:document.title, url:window.location.href, head:!!document.querySelector('.gm-mt__head'), chips:document.querySelectorAll('.gm-mt-chip').length, stats:document.querySelectorAll('.gm-mt-stat').length, cards:document.querySelectorAll('.gm-mt-card').length, empty:!!document.querySelector('.gm-mt-empty'), titleText:(document.querySelector('.gm-mt__head-title')||{}).innerText, bodySample:(document.body.innerText||'').substring(0,400)})"
$jsJson = $js | ConvertTo-Json -Compress
$params = '{"expression":' + $jsJson + ',"returnByValue":true}'
Send-Cdp 99 'Runtime.evaluate' $params
$resp = Read-Cdp
Write-Host "===PAGE==="
Write-Host $resp

# Look for console errors
Write-Host "===CONSOLE==="
Send-Cdp 100 'Runtime.evaluate' '{"expression":"(window.__errors||[]).join(String.fromCharCode(10))","returnByValue":true}'
$resp2 = Read-Cdp
Write-Host $resp2

$ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'bye', $cts.Token).GetAwaiter().GetResult() | Out-Null
