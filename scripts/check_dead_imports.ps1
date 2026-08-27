$targetFiles = @("Profile.js", "WelcomeModal.js", "SuggestionModal.js", "ViewProfile.js", "Toast.js", "Header.js", "Sidebar.js")
$srcRoot = "C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src"

Get-ChildItem $srcRoot -Recurse -Include "*.js","*.jsx" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Where-Object {
    $name = $_.Name
    -not ($targetFiles -contains $name) -and $name -ne "Map.js"
  } |
  ForEach-Object {
    $rel = $_.FullName.Replace($srcRoot + "\", "")
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
      foreach ($target in $targetFiles) {
        $pattern = "from\s+['\`"][\./]*components/" + [regex]::Escape($target) + "['\`"]"
        if ($content -match $pattern) {
          Write-Host "  $rel uses components/$target"
        }
        $pattern2 = "from\s+['\`"][\./]*pages/" + [regex]::Escape($target) + "['\`"]"
        if ($content -match $pattern2) {
          Write-Host "  $rel uses pages/$target"
        }
      }
    }
  }
