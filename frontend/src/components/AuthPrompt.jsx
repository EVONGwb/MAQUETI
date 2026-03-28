import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";

export default function AuthPrompt({
  open,
  title,
  message,
  onClose,
  onGoogleSuccess,
  onGoogleError,
  onPasskey,
  onEmailLogin,
  onEmailRegister,
  error,
}) {
  const [mode, setMode] = useState("login");
  const providersRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("login");
      setName("");
      setEmail("");
      setPassword("");
      setSubmitting(false);
    }
  }, [open]);

  const sheet = useMemo(
    () => ({
      hidden: { opacity: 0, y: 18, scale: 0.98, filter: "blur(10px)" },
      show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.22, ease: [0.2, 0.9, 0.2, 1] } },
      exit: { opacity: 0, y: 18, scale: 0.98, filter: "blur(10px)", transition: { duration: 0.16 } },
    }),
    []
  );

  const backdrop = useMemo(
    () => ({
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.18 } },
      exit: { opacity: 0, transition: { duration: 0.14 } },
    }),
    []
  );

  const subtitle = mode === "register" ? "Regístrate para chatear, guardar favoritos y comprar" : "Inicia sesión para continuar";
  const detail = String(message || "").trim();
  const detailLine = detail ? detail : subtitle;
  const goToMode = (next) => {
    setMode(next);
    requestAnimationFrame(() => {
      providersRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "login") {
        await onEmailLogin?.({ email, password });
      } else {
        await onEmailRegister?.({ name, email, password });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="ap-root" initial="hidden" animate="show" exit="exit" variants={backdrop} role="dialog" aria-modal="true">
          <motion.button className="ap-backdrop" type="button" onClick={onClose} aria-label="Cerrar" />
          <motion.div
            className="ap-sheet"
            variants={sheet}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.14}
            onDragEnd={(_, info) => {
              if (info?.offset?.y > 90) onClose?.();
            }}
          >
            <div className="ap-handle" />
            <div className="ap-top">
              <div className="ap-icon" aria-hidden="true">
                🔒
              </div>
              <div className="ap-copy">
                <h3 className="ap-title">{title || "Necesitas una cuenta"}</h3>
                <p className="ap-subtitle">{detailLine}</p>
              </div>
              <button className="ap-close" type="button" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="ap-actions">
              <button className={`ap-btn ${mode === "login" ? "primary" : "ghost"}`} type="button" onClick={() => goToMode("login")} aria-pressed={mode === "login"}>
                Entrar
              </button>
              <button className={`ap-btn ${mode === "register" ? "primary" : "ghost"}`} type="button" onClick={() => goToMode("register")} aria-pressed={mode === "register"}>
                Registrarme
              </button>
              <button className="ap-btn text" type="button" onClick={onClose}>
                Ahora no
              </button>
            </div>

            <form className="ap-form" onSubmit={submit}>
              {mode === "register" ? (
                <input className="ap-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" autoComplete="name" />
              ) : null}
              <input className="ap-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" inputMode="email" autoComplete="email" />
              <input className="ap-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />
              <button className="ap-provider-btn" type="submit" disabled={submitting}>
                {submitting ? "Procesando..." : mode === "login" ? "Entrar con email" : "Crear cuenta"}
              </button>
            </form>

            <div className="ap-providers" ref={providersRef}>
              <div className="ap-provider">
                <GoogleLogin onSuccess={onGoogleSuccess} onError={onGoogleError} />
              </div>
              {mode === "login" ? (
                <button className="ap-provider-btn" type="button" onClick={onPasskey}>
                  Entrar con huella
                </button>
              ) : (
                <div className="ap-hint">Puedes registrarte con email o con Google. La huella se activa después en Perfil.</div>
              )}
            </div>

            {error ? <div className="ap-error">{error}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
