// Opens print windows synchronously (before any async fetch) so users never see
// about:blank while a PDF request is pending, failing, or slow to render.
const LOADING_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Memuat dokumen...</title>
<style>
  html, body {
    height: 100%;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    color: #555;
  }
  .wrap { display: flex; align-items: center; }
  .loader {
    border: 3px solid #ddd;
    border-top-color: #666;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    animation: spin 0.8s linear infinite;
    margin-inline-end: 12px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="loader"></div>
    <span>Memuat dokumen cetak...</span>
  </div>
</body>
</html>`

export function openPrintTab(url) {
  const win = window.open(url, '_blank')

  if (win)
    win.opener = null

  return win
}

export function openLoadingPrintTab() {
  const win = window.open('', '_blank')

  if (win) {
    win.document.open()
    win.document.write(LOADING_HTML)
    win.document.close()
  }

  return win
}
