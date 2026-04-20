(function () {
  function extract() {
    const turns = document.querySelectorAll("user-query, model-response");
    if (turns.length) {
      return Array.from(turns).map((el) => {
        const role = el.tagName.toLowerCase().includes("user") ? "USER" : "GEMINI";
        return `### ${role}\n${el.innerText.trim()}`;
      }).join("\n\n");
    }
    const main = document.querySelector("main");
    return main?.innerText?.trim() || document.body.innerText.trim();
  }
  const tryMount = () => window.ACB.mountFab({
    platform: "gemini",
    getContent: extract,
    getTitle: () => document.title.replace(/ - Gemini.*$/, ""),
  });
  tryMount();
  new MutationObserver(() => tryMount()).observe(document.body, { childList: true, subtree: true });
})();
