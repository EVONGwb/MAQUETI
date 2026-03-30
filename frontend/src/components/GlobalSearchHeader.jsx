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

  const handleSearch = (term) => {
    if (!term.trim()) return;
    setSearch(term);
    setActiveCategory("Todo");
    setIsOpen(false);
    navigate("/");
    setHistory(prev => {
      const newHist = [term, ...prev.filter(t => t !== term)].slice(0, 5);
      return newHist;
    });
  };

  const handleClearHistory = () => setHistory([]);

  // Compute suggestions based on localSearch
  const suggestions = useMemo(() => {
    if (!localSearch.trim() || !products) return [];
    const term = localSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(term)).slice(0, 4);
  }, [localSearch, products]);

  return (
    <>
      <div className="gs-header">
        <div className="gs-header-inner">
          <div className="gs-search-bar" onClick={() => setIsOpen(true)}>
            <Search size={18} className="gs-icon" />
            <span className="gs-placeholder">
              {localSearch || "Buscar productos, tiendas..."}
            </span>
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
            <div className="gs-overlay-header">
              <div className="gs-input-wrapper">
                <Search size={20} className="gs-icon-active" />
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  placeholder="¿Qué estás buscando?"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      handleSearch(localSearch);
                    }
                  }}
                />
                {localSearch && (
                  <button className="gs-clear-btn" onClick={() => setLocalSearch("")}>
                    <X size={16} />
                  </button>
                )}
              </div>
              <button className="gs-cancel-btn" onClick={() => setIsOpen(false)}>
                Cancelar
              </button>
            </div>

            <div className="gs-overlay-content">
              {/* Sugerencias en tiempo real */}
              {localSearch.trim() && suggestions.length > 0 && (
                <div className="gs-section">
                  <h4>Sugerencias</h4>
                  <ul className="gs-suggestions">
                    {suggestions.map(p => (
                      <li key={p._id} onClick={() => {
                        setIsOpen(false);
                        navigate(`/product/${p._id}`);
                      }}>
                        <Search size={14} />
                        <span>{p.name}</span>
                        <ArrowRight size={14} className="gs-arrow" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Historial */}
              {!localSearch.trim() && history.length > 0 && (
                <div className="gs-section">
                  <div className="gs-section-header">
                    <h4>Búsquedas recientes</h4>
                    <button onClick={handleClearHistory}>Borrar</button>
                  </div>
                  <ul className="gs-history">
                    {history.map((term, i) => (
                      <li key={i} onClick={() => handleSearch(term)}>
                        <Clock size={14} />
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Categorías (siempre visibles o cuando no hay búsqueda) */}
              {!localSearch.trim() && categories && categories.length > 0 && (
                <div className="gs-section">
                  <h4>Categorías populares</h4>
                  <div className="gs-chips">
                    {categories.slice(0, 6).map(cat => (
                      <button
                        key={cat}
                        className="gs-chip"
                        onClick={() => {
                          setActiveCategory(cat);
                          setSearch("");
                          setIsOpen(false);
                          navigate("/");
                        }}
                      >
                        {cat}
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
