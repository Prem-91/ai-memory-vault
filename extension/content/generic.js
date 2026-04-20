// Generic capture for any AI chatbot not explicitly supported.
// Detects platform from hostname and grabs the most chat-like content available.
(function () {
  const host = location.hostname;
  const platform =
    host.includes("perplexity") ? "perplexity" :
    host.includes("copilot") || host.includes("bing.com") ? "copilot" :
    host.includes("mistral") || host.includes("lechat") ? "mistral" :
    host.includes("deepseek") ? "deepseek" :
    host.includes("grok") || host.includes("x.ai") ? "grok" :
    host.includes("poe.com") ? "poe" :
    host.includes("you.com") ? "you" :
    host.includes("phind") ? "phind" :
    host.includes("character.ai") ? "character" :
    host.includes("huggingface") ? "huggingface" :
    host.replace(/^www\./, "").split(".")[0];

  function extract() {
    // Try common chat patterns first
    const candidates = [
      "[role='log'] [role='listitem']",
      "[data-testid*='message']",
      "[data-message-author-role]",
      "main article",
      "main [role='article']",
    ];
    for (const sel of candidates) {
      const nodes = document.querySelectorAll(sel);
      if (nodes.length >= 2) {
        return Array.from(nodes).map((el, i) => {
          const txt = el.innerText.trim();
          return txt ? `### TURN ${i + 1}\n${txt}` : "";
        }).filter(Boolean).join("\n\n");
      }
    }
    const main = document.querySelector("main") || document.querySelector("[role='main']");
    return (main?.innerText || document.body.innerText || "").trim();
  }

  function tryMount() {
    if (!window.ACB) return;
    window.ACB.mountFab({
      platform,
      getContent: extract,
      getTitle: () => document.title.split(" - ")[0].split(" | ")[0],
    });
  }

  tryMount();
  new MutationObserver(() => tryMount()).observe(document.body, { childList: true, subtree: true });
})();
