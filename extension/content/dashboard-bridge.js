// Inject a marker so the dashboard can detect the extension
(function () {
  const s = document.createElement("script");
  s.textContent = `window.__AI_MEMORY_VAULT_EXTENSION = true; window.__ACB_VERSION = "1.0.0";`;
  (document.head || document.documentElement).appendChild(s);
  s.remove();
})();
