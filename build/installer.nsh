!macro customInstall
  Delete "$SMPROGRAMS\今日日程.lnk"
  CreateShortCut "$SMPROGRAMS\今日日程.lnk" "$INSTDIR\今日日程.exe" "" "$INSTDIR\今日日程.exe" 0
!macroend
