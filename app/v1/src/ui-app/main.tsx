import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { LanguageContext, MESSAGES, resolveLanguage } from "./i18n.ts";
import "./index.css";

void resolveLanguage(window.location.search, (path) =>
  fetch(path, { headers: { accept: "application/json" }, credentials: "same-origin" }),
).then((language) => {
  document.documentElement.lang = language;
  document.title = MESSAGES[language].appName;
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <LanguageContext.Provider value={language}>
        <App />
      </LanguageContext.Provider>
    </React.StrictMode>,
  );
});
