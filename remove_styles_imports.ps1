# Script para remover imports de styles.css
$files = @(
    "src\components\AdminLayout.js",
    "src\components\Footer.js", 
    "src\components\InstallAppModal.js",
    "src\components\Notifications.js",
    "src\components\Profile.js",
    "src\components\SplashScreen.js",
    "src\components\Toast.js",
    "src\components\TravelDetails.js",
    "src\pages\Achievements.js",
    "src\pages\BlockedUsers.js",
    "src\pages\FutureTravels.js",
    "src\pages\HelpSupport.js",
    "src\pages\Login.js",
    "src\pages\MyTravels.js",
    "src\pages\QandA.js",
    "src\pages\Register.js",
    "src\pages\ResetPassword.js",
    "src\pages\Travels.js",
    "src\pages\UserProfile.js",
    "src\pages\Users.js",
    "src\pages\weather.js"
)

foreach ($file in $files) {
    $fullPath = "c:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\$file"
    if (Test-Path $fullPath) {
        Write-Host "Processando $file..."
        $content = Get-Content $fullPath -Raw
        $newContent = $content -replace "import\s+['\`"]\.\.\/styles\/styles\.css['\`"];\s*\r?\n?", ""
        $newContent = $newContent -replace "import\s+['\`"]\.\/styles\/styles\.css['\`"];\s*\r?\n?", ""
        Set-Content $fullPath $newContent -NoNewline
        Write-Host "✓ Removido import de $file"
    } else {
        Write-Host "✗ Arquivo não encontrado: $file"
    }
}

Write-Host "Concluido! Removidos os imports de styles.css de todos os arquivos."
