$c = Get-Content 'app\dashboard\page.tsx' -Encoding UTF8
# Lines 1-447 (good: everything up to </main>)
# Lines 448-512: old support widget -> replace with <SupportWidget biz={biz} />
# Lines 513-592: old pay modal -> replace with <PayModal biz={biz} open={payModalOpen} onClose={() => setPayModalOpen(false)} />
# Lines 593-701: old onboarding modal -> replace with <OnboardingModal ... /> + closing
# Lines 702-end: ToastBar + closing (keep)

$head = $c[0..446]  # lines 1-447

$newComponents = @(
  '',
  '      <SupportWidget biz={biz} />',
  '',
  '      <PayModal biz={biz} open={payModalOpen} onClose={() => setPayModalOpen(false)} />',
  '',
  '      {showOnboarding && (',
  '        <OnboardingModal',
  '          biz={biz}',
  '          setBiz={setBiz}',
  '          saving={saving}',
  '          setSaving={setSaving}',
  '          showToast={pushToast}',
  '        />',
  '      )}',
  ''
)

$tail = $c[701..($c.Length-1)]  # lines 702-end (ToastBar + closing)

$out = $head + $newComponents + $tail
$out | Set-Content 'app\dashboard\page.tsx' -Encoding UTF8
Write-Host "Done. Lines before: $($c.Length), Lines after: $($out.Length)"
