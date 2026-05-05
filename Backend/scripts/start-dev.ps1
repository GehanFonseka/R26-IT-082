# Kill Port 3001 and Start Server
# This script kills any process using port 3001 and starts the development server

$PORT = 3001
$processingPorts = netstat -ano | Select-String ":$PORT"

if ($processingPorts) {
    $lines = $processingPorts -split '\n'
    foreach ($line in $lines) {
        if ($line -match '(\d+)$') {
            $pid = $Matches[1]
            Write-Host "🔍 Found process $pid using port $PORT"
            
            try {
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "✓ Successfully killed process $pid"
                Start-Sleep -Seconds 1
            }
            catch {
                Write-Host "✗ Failed to kill process $pid"
            }
        }
    }
}

Write-Host "✓ Port $PORT is now available"
Write-Host "▶ Starting development server..."
npm run dev
