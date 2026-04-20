(function () {
  function extract() {
    const turns = document.querySelectorAll('[data-message-author-role]');
    if (turns.length) {
      return Array.from(turns).map((el) => {
        const role = el.getAttribute("data-message-author-role") || "?";
        return `### ${role.toUpperCase()}\n${el.innerText.trim()}`;
      }).join("\n\n");
    }
    const main = document.querySelector("main");
    return main?.innerText?.trim() || document.body.innerText.trim();
  }
  const tryMount = () => window.ACB.mountFab({
    platform: "chatgpt",
    getContent: extract,
    getTitle: () => document.title.replace(/ - ChatGPT.*$/, ""),
  });
  tryMount();
  new MutationObserver(() => tryMount()).observe(document.body, { childList: true, subtree: true });
})();
