(function () {
  function extract() {
    const messages = document.querySelectorAll('[data-testid*="message"], .font-claude-message, .font-user-message');
    if (messages.length) {
      return Array.from(messages).map((el, i) => {
        const isUser = el.className.includes("user");
        return `### ${isUser ? "USER" : "CLAUDE"}\n${el.innerText.trim()}`;
      }).join("\n\n");
    }
    const main = document.querySelector("main");
    return main?.innerText?.trim() || document.body.innerText.trim();
  }
  const tryMount = () => window.ACB.mountFab({
    platform: "claude",
    getContent: extract,
    getTitle: () => document.title.replace(/ - Claude.*$/, ""),
  });
  tryMount();
  new MutationObserver(() => tryMount()).observe(document.body, { childList: true, subtree: true });
})();
