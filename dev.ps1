<#  Ghar Khata — Web dev helper (Windows)
    Usage:  .\dev.ps1 <command>
    Commands: install | web | test | e2e | lint | gen  #>
param([Parameter(Position = 0)][string]$Cmd = 'web')

switch ($Cmd) {
  'install' { npm install --legacy-peer-deps }
  'test'    { npx ng test --no-watch }
  'e2e'     { npx playwright test }
  'lint'    { npx ng lint }
  'gen'     { npm run gen:api }
  default   { npx ng serve --port 4200 }
}
