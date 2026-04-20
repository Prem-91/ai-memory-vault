// Shared helpers loaded before each platform script
window.__AI_MEMORY_VAULT_EXTENSION = true;
window.__ACB_VERSION = "1.0.0";

window.ACB = {
  toast(text, error = false) {
    const t = document.createElement("div");
    t.className = "acb-toast" + (error ? " err" : "");
    t.textContent = text;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2500);
  },
  send(msg) { return new Promise((res) => chrome.runtime.sendMessage(msg, res)); },
  async capture({ title, content, platform }) {
    if (!content || content.length < 10) { this.toast("Nothing to capture", true); return; }
    const r = await this.send({
      type: "ACB_SYNC",
      payload: {
        title: (title || document.title || "Capture").slice(0, 200),
        raw_content: content.slice(0, 100000),
        source_platform: platform,
        capture_method: "fab",
      },
    });
    if (r?.ok) this.toast("Captured ✓");
    else this.toast(r?.error || "Sync failed", true);
  },
  mountFab({ platform, getContent, getTitle }) {
    if (document.querySelector(".acb-fab")) return;
    const btn = document.createElement("button");
    btn.className = "acb-fab";
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20"/></svg> Capture to Vault`;
    btn.addEventListener("click", () => {
      this.capture({ title: getTitle?.(), content: getContent(), platform });
    });
    document.body.appendChild(btn);
  },
};

chrome.runtime.onMessage.addListener((m) => {
  if (m?.type === "ACB_TOAST") window.ACB.toast(m.text, m.error);
});
