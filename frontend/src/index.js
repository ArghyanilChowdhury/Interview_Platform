import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Hide any injected badges
const observer = new MutationObserver(() => {
  document.querySelectorAll('a[href*="emergentagent"], div[style*="Made with"]').forEach(el => {
    el.style.display = 'none';
  });
});
observer.observe(document.body, { childList: true, subtree: true });
