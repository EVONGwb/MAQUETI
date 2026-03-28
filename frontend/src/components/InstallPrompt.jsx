import React, { useEffect, useMemo, useState } from "react";

const isIos = () => {
  const ua = window.navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
};

const isStandalone = () => {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
};

const isMobile = () => {
  return window.matchMedia?.("(max-width: 720px)")?.matches || false;
};

const shouldShowAgain = () => {
  try {
    const raw = localStorage.getItem("maqueti_install_dismissed_at");
    if (!raw) return true;
    const t = Number(raw);
    if (!Number.isFinite(t)) return true;
    return Date.now() - t > 7 * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const eligible = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (isStandalone()) return false;
    if (!shouldShowAgain()) return false;
    return true;
  }, []);

  useEffect(() => {
    if (!eligible) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    if (isIos() || isMobile()) setOpen(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, [eligible]);

  const dismiss = () => {
    try {
      localStorage.setItem("maqueti_install_dismissed_at", String(Date.now()));
    } catch {
      undefined;
    }
    setOpen(false);
    setShowHelp(false);
  };

  const install = async () => {
    if (!deferred) {
      setShowHelp(true);
      return;
    }
    try {
      deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
      dismiss();
    }
  };

  if (!open) return null;

  return (
    <div className="install-banner" role="region" aria-label="Descargar app">
      <div className="install-banner-content">
        <div className="install-banner-title">Descargar MAQUETI</div>
        <div className="install-banner-subtitle">Instala la app en tu móvil para una mejor experiencia.</div>
      </div>
      <div className="install-banner-actions">
        <button className="install-btn" type="button" onClick={install}>
          Descargar
        </button>
        <button className="install-close" type="button" onClick={dismiss} aria-label="Cerrar">
          ×
        </button>
      </div>

      {showHelp ? (
        <div className="install-ios">
          <div className="install-ios-card">
            <div className="install-ios-title">Instalar en tu móvil</div>
            {isIos() ? (
              <div className="install-ios-text">Pulsa Compartir y luego “Añadir a pantalla de inicio”.</div>
            ) : (
              <div className="install-ios-text">Abre el menú del navegador y pulsa “Instalar app” o “Añadir a pantalla de inicio”.</div>
            )}
            <button className="install-btn" type="button" onClick={dismiss}>
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
