import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalSearchHeader({ search, setSearch, categories, setActiveCategory, products }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search || "");
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("mq_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem("mq_search_history", JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  const handleSearchSubmit = (term) => {
    const trimmed = String(term || "").trim();
    if (!trimmed) return;
    
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 5);
    });
    
    setSearch(trimmed);
    setIsOpen(false);
    navigate("/explore");
  };

  const clearHistory = () => setHistory([]);

  const removeHistoryItem = (e, item) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((h) => h !== item));
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setIsOpen(false);
    navigate("/explore");
  };

  // Compute suggestions based on localSearch
  const suggestions = useMemo(() => {
    if (!localSearch.trim() || !products) return [];
    const term = localSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(term)).slice(0, 4);
  }, [localSearch, products]);

  return (
    <>
      <div className="gs-header-wrap">
        <div className="gs-search-bar" onClick={() => setIsOpen(true)}>
          <Search size={18} className="gs-search-icon" />
          <div className="gs-search-placeholder">
            {search ? search : "Buscar productos, tiendas..."}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="gs-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="gs-overlay-top">
              <form
                className="gs-overlay-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchSubmit(localSearch);
                }}
              >
                <Search size={18} className="gs-search-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar productos, tiendas..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="gs-overlay-input"
                />
                {localSearch && (
                  <button type="button" className="gs-clear-btn" onClick={() => setLocalSearch("")}>
                    <X size={16} />
                  </button>
                )}
              </form>
              <button className="gs-cancel-btn" onClick={() => setIsOpen(false)}>Cancelar</button>
            </div>

            <div className="gs-overlay-content">
              {/* Sugerencias en tiempo real */}
              {localSearch.trim() && suggestions.length > 0 && (
                <div className="gs-section">
                  <h4 className="gs-section-title">Sugerencias</h4>
                  <ul className="gs-suggestions-list">
                    {suggestions.map((s) => (
                      <li key={s.id} onClick={() => { navigate(`/product/${s.id}`); setIsOpen(false); }}>
                        <Search size={14} />
                        <span>{s.title}</span>
                        <ArrowRight size={14} className="gs-sug-arrow" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Historial */}
              {!localSearch.trim() && history.length > 0 && (
                <div className="gs-section">
                  <div className="gs-section-head">
                    <h4 className="gs-section-title">Búsquedas recientes</h4>
                    <button className="gs-text-btn" onClick={clearHistory}>Borrar</button>
                  </div>
                  <ul className="gs-history-list">
                    {history.map((h, i) => (
                      <li key={i} onClick={() => { setLocalSearch(h); handleSearchSubmit(h); }}>
                        <Clock size={16} className="gs-hist-icon" />
                        <span>{h}</span>
                        <button className="gs-hist-del" onClick={(e) => removeHistoryItem(e, h)}>
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Categorías (siempre visibles o cuando no hay búsqueda) */}
              {!localSearch.trim() && categories?.length > 0 && (
                <div className="gs-section">
                  <h4 className="gs-section-title">Explorar categorías</h4>
                  <div className="gs-chips">
                    {categories.map((c) => (
                      <button key={c} className="gs-chip" onClick={() => handleCategoryClick(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
