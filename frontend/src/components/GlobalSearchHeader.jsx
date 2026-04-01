import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Search, X, Clock, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { resolveImageSrc } from "../services/api";
import { priceLabel } from "../services/format";

export default function GlobalSearchHeader({ search, setSearch, products, categories, setActiveCategory }) {
  const [open, setOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [query, setQuery] = useState(search || "");
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("mq_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(search || "");
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem("mq_search_history", JSON.stringify(history));
    } catch {
      undefined;
    }
  }, [history]);

  useEffect(() => {
    const el0 = wrapRef.current;
    if (!el0 || typeof ResizeObserver === "undefined") return undefined;
    const el = el0.closest(".st-header") || el0;
    const apply = () => {
      try {
        document.documentElement.style.setProperty("--gs-height", `${el.offsetHeight}px`);
      } catch {
        undefined;
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setCatsOpen(false);
      }
    };
    if (open || catsOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, catsOpen]);

  const suggestions = useMemo(() => {
    const term = String(query || "").trim().toLowerCase();
    if (!term || !Array.isArray(products)) return [];
    return products
      .filter((p) => String(p?.title || "").toLowerCase().includes(term) || String(p?.category || "").toLowerCase().includes(term))
      .slice(0, 6);
  }, [query, products]);

  const clearHistory = () => setHistory([]);

  const commitSearch = (term) => {
    const trimmed = String(term || "").trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 6);
    });
    setSearch(trimmed);
    setOpen(false);
    navigate("/explore");
  };

  const goCategory = (cat) => {
    if (!setActiveCategory) return;
    if (!cat) setActiveCategory("");
    else setActiveCategory(cat);
    setCatsOpen(false);
    setOpen(false);
    navigate("/explore");
  };

  const catsList = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories;
  }, [categories]);

  return (
    <>
      <div className="gs-header-wrap" ref={wrapRef}>
        <form
          className="gs-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            commitSearch(query);
          }}
        >
          <div className="gs-search-field">
            <Search size={18} className="gs-search-icon" />
            <input
              ref={inputRef}
              className="gs-search-input"
              type="search"
              placeholder="Buscar en MAQUETI"
              value={query}
              onChange={(e) => {
                const next = e.target.value;
                setQuery(next);
                setSearch(next);
              }}
              onFocus={() => setOpen(true)}
            />
            {catsList.length ? (
              <button
                type="button"
                className="gs-cat-btn"
                aria-label="Categorías"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setCatsOpen(true);
                  setOpen(false);
                }}
              >
                <LayoutGrid size={18} />
              </button>
            ) : null}
            {query ? (
              <button
                type="button"
                className="gs-clear-btn"
                onClick={() => {
                  setQuery("");
                  setSearch("");
                  try {
                    inputRef.current?.focus();
                  } catch {
                    undefined;
                  }
                }}
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              className="gs-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="gs-suggest-wrap"
              initial={{ opacity: 0, y: -8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.18 }}
            >
              {String(query || "").trim() ? (
                suggestions.length ? (
                  <div className="gs-section">
                    <div className="gs-section-head">
                      <h4 className="gs-section-title">Sugerencias</h4>
                      <button type="button" className="gs-text-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => commitSearch(query)}>
                        Ver resultados
                        <ArrowRight size={14} className="gs-sug-arrow" />
                      </button>
                    </div>
                    <ul className="gs-suggestions-list">
                      {suggestions.map((p) => (
                        <li
                          key={p.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setOpen(false);
                            navigate(`/product/${p.id}`);
                          }}
                        >
                          <div
                            className="gs-sug-thumb"
                            style={
                              p.imageUrl
                                ? { backgroundImage: `url(${resolveImageSrc(p.imageUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }
                                : undefined
                            }
                          />
                          <div className="gs-sug-main">
                            <div className="gs-sug-title">{p.title}</div>
                            <div className="gs-sug-sub">{priceLabel(p.price)}</div>
                          </div>
                          <ArrowRight size={14} className="gs-sug-arrow" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="gs-empty">Sin sugerencias. Pulsa Enter para buscar.</div>
                )
              ) : history.length ? (
                <div className="gs-section">
                  <div className="gs-section-head">
                    <h4 className="gs-section-title">Recientes</h4>
                    <button type="button" className="gs-text-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => clearHistory()}>
                      Borrar
                    </button>
                  </div>
                  <ul className="gs-history-list">
                    {history.map((h) => (
                      <li
                        key={h}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setQuery(h);
                          setSearch(h);
                          commitSearch(h);
                        }}
                      >
                        <Clock size={16} className="gs-hist-icon" />
                        <span>{h}</span>
                        <button type="button" className="gs-hist-del" onMouseDown={(e) => e.preventDefault()} onClick={(e) => {
                          e.stopPropagation();
                          setHistory((prev) => prev.filter((x) => x !== h));
                        }}>
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="gs-empty">Escribe para buscar productos.</div>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {catsOpen ? (
          <>
            <motion.button
              type="button"
              className="gs-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setCatsOpen(false)}
            />
            <motion.div
              className="gs-cat-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
              role="dialog"
              aria-label="Categorías"
            >
              <div className="gs-cat-head">
                <div className="gs-cat-title">Categorías</div>
                <button type="button" className="gs-cat-close" onClick={() => setCatsOpen(false)} aria-label="Cerrar">
                  <X size={18} />
                </button>
              </div>
              <div className="gs-cat-scroll">
                <button type="button" className="gs-cat-item" onClick={() => goCategory("")}>
                  Ver todo
                  <ArrowRight size={16} className="gs-cat-arrow" />
                </button>
                {catsList.map((c) => (
                  <button key={c} type="button" className="gs-cat-item" onClick={() => goCategory(c)}>
                    {c}
                    <ArrowRight size={16} className="gs-cat-arrow" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
