const $ = (id) => document.getElementById(id);

async function send(msg) {
  return new Promise((res) => chrome.runtime.sendMessage(msg, res));
}

async function refresh() {
  const cfg = await send({ type: "ACB_GET_CONFIG" });
  $("dashboard-url").value = cfg.dashboardUrl || "";
  if (cfg.accessToken) {
    $("status-dot").classList.add("on");
    $("status-text").textContent = "Connected";
    $("signed-out").style.display = "none";
    $("signed-in").style.display = "block";
  } else {
    $("status-dot").classList.remove("on");
    $("status-text").textContent = "Not connected";
    $("signed-out").style.display = "block";
    $("signed-in").style.display = "none";
  }
}

$("save-token").addEventListener("click", async () => {
  const accessToken = $("token").value.trim();
  const dashboardUrl = $("dashboard-url").value.trim();
  if (!accessToken) { $("msg").innerHTML = '<span class="err">Token required.</span>'; return; }
  await chrome.storage.local.set({ dashboardUrl });
  await send({ type: "ACB_SET_TOKEN", accessToken });
  $("msg").innerHTML = '<span class="ok">Connected ✓</span>';
  refresh();
});

$("open-dashboard").addEventListener("click", () => send({ type: "ACB_OPEN_DASHBOARD" }));
$("open-dashboard-2").addEventListener("click", () => send({ type: "ACB_OPEN_DASHBOARD" }));

$("signout").addEventListener("click", async () => {
  await chrome.storage.local.remove(["accessToken", "refreshToken"]);
  $("msg").innerHTML = "Disconnected.";
  refresh();
});

$("capture-now").addEventListener("click", async () => {
  $("msg").textContent = "Capturing…";
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) { $("msg").innerHTML = '<span class="err">No active tab.</span>'; return; }
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const title = document.title || "Captured page";
        const text = document.body?.innerText?.slice(0, 50000) || "";
        return { title, text };
      },
    });
    const url = tab.url || "";
    const h = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
    const platform =
      h.includes("chatgpt.com") || h.includes("openai.com") ? "chatgpt" :
      h.includes("claude.ai") ? "claude" :
      h.includes("gemini.google.com") ? "gemini" :
      h.includes("perplexity") ? "perplexity" :
      h.includes("copilot") || h.includes("bing.com") ? "copilot" :
      h.includes("mistral") ? "mistral" :
      h.includes("deepseek") ? "deepseek" :
      h.includes("grok") || h.includes("x.com") ? "grok" :
      h.includes("poe.com") ? "poe" :
      h.includes("you.com") ? "you" :
      h.includes("phind") ? "phind" :
      h.includes("huggingface") ? "huggingface" :
      "manual";
    const r = await send({
      type: "ACB_SYNC",
      payload: {
        title: result.title.slice(0, 200),
        raw_content: result.text,
        source_platform: platform,
        capture_method: "popup",
      },
    });
    if (r.ok) $("msg").innerHTML = '<span class="ok">Captured ✓</span>';
    else $("msg").innerHTML = `<span class="err">${r.error}</span>`;
  } catch (e) {
    $("msg").innerHTML = `<span class="err">${e.message}</span>`;
  }
});

refresh();
