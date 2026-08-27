$removed = @("Profile.js", "WelcomeModal.js", "SuggestionModal.js", "ViewProfile.js", "Toast.js")
$srcRoot = "C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src"

Get-ChildItem $srcRoot -Recurse -Include "*.test.js","*.test.jsx" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    $rel = $_.FullName.Replace($srcRoot + "\", "")
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
      foreach ($target in $removed) {
        $baseName = $target -replace '\.jsx?$', ''
        # Use word boundary regex to avoid matching "ProfilePhotoUploader"
        $pattern = "(^|[\s/'\`\"])" + [regex]::Escape($baseName) + "($|[\s/'\`\".])"
        if ($content -match $pattern) {
          Write-Host "  $rel references $target"
        }
      }
    }
  }
