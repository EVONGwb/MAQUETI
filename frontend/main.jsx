import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./styles/global.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "TU_CLIENT_ID_AQUI";

if (typeof window !== "undefined") {
  window.__MAQUETI_GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
  window.__MAQUETI_ORIGIN = window.location.origin;
  console.log("MAQUETI Google Client ID:", GOOGLE_CLIENT_ID);
  console.log("MAQUETI Origin:", window.location.origin);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
); 

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
