// AI Context Bridge — background service worker
const DEFAULT_DASHBOARD = "https://id-preview--4e5a789f-e030-464d-819a-44b41edd0b62.lovable.app";

async function getConfig() {
  const { dashboardUrl, accessToken, refreshToken } = await chrome.storage.local.get([
    "dashboardUrl",
    "accessToken",
    "refreshToken",
  ]);
  return {
    dashboardUrl: dashboardUrl || DEFAULT_DASHBOARD,
    accessToken,
    refreshToken,
  };
}

async function syncMemory(payload) {
  const { dashboardUrl, accessToken } = await getConfig();
  if (!accessToken) throw new Error("Not signed in. Open the extension popup and paste your token.");

  const res = await fetch(`${dashboardUrl}/api/extension/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Sync failed (${res.status})`);
  return data;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "ACB_SYNC") {
    syncMemory(msg.payload)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg?.type === "ACB_OPEN_DASHBOARD") {
    getConfig().then(({ dashboardUrl }) => chrome.tabs.create({ url: `${dashboardUrl}/dashboard` }));
    return false;
  }
  if (msg?.type === "ACB_SET_TOKEN") {
    chrome.storage.local.set({ accessToken: msg.accessToken, refreshToken: msg.refreshToken || null });
    sendResponse({ ok: true });
    return false;
  }
  if (msg?.type === "ACB_GET_CONFIG") {
    getConfig().then((c) => sendResponse(c));
    return true;
  }
});

// Context menu: capture selection
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "acb-capture-selection",
    title: "Capture selection to AI Context Bridge",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "acb-capture-selection" || !info.selectionText) return;
  const platform = (() => {
    const u = tab?.url || "";
    if (u.includes("chatgpt.com") || u.includes("openai.com")) return "chatgpt";
    if (u.includes("claude.ai")) return "claude";
    if (u.includes("gemini.google.com")) return "gemini";
    return "selection";
  })();
  try {
    await syncMemory({
      title: (info.selectionText.slice(0, 80) || "Selection capture").trim(),
      raw_content: info.selectionText,
      source_platform: platform,
      capture_method: "selection",
    });
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "ACB_TOAST", text: "Captured to vault ✓" });
  } catch (e) {
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "ACB_TOAST", text: `Capture failed: ${e.message}`, error: true });
  }
});
