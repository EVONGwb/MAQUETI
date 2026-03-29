import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight, MonitorSmartphone, Shirt, Home, Car, Gamepad2, Dumbbell, Sparkles, Gem, Baby, PawPrint, Wrench, Shapes, X } from "lucide-react";

const vibrate = (ms) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    undefined;
  }
};

const CATEGORY_TREE = [
  {
    name: "Tecnología",
    icon: MonitorSmartphone,
    subcategories: ["Móviles", "Ordenadores", "Consolas", "Audio", "TV y vídeo", "Accesorios", "Wearables", "Componentes", "Otros"],
  },
  {
    name: "Moda",
    icon: Shirt,
    subcategories: ["Hombre", "Mujer", "Niños", "Zapatos", "Bolsos", "Relojes", "Accesorios", "Otros"],
  },
  {
    name: "Hogar",
    icon: Home,
    subcategories: ["Muebles", "Decoración", "Cocina", "Electrodomésticos", "Jardín", "Limpieza", "Iluminación", "Otros"],
  },
  {
    name: "Motor",
    icon: Car,
    subcategories: ["Coches", "Motos", "Recambios", "Accesorios", "Neumáticos", "Herramientas", "Otros"],
  },
  {
    name: "Gaming",
    icon: Gamepad2,
    subcategories: ["Consolas", "Juegos", "PC Gaming", "Mandos", "Accesorios", "Coleccionables", "Otros"],
  },
  {
    name: "Deporte",
    icon: Dumbbell,
    subcategories: ["Fitness", "Fútbol", "Running", "Ciclismo", "Outdoor", "Natación", "Otros"],
  },
  {
    name: "Belleza",
    icon: Sparkles,
    subcategories: ["Perfumes", "Maquillaje", "Cuidado facial", "Cuidado capilar", "Cuidado corporal", "Otros"],
  },
  {
    name: "Coleccionismo",
    icon: Gem,
    subcategories: ["Trading Cards", "Figuras", "Vintage", "Comics", "Arte", "Monedas", "Otros"],
  },
  {
    name: "Niños",
    icon: Baby,
    subcategories: ["Ropa", "Juguetes", "Carritos", "Sillas", "Higiene", "Otros"],
  },
  {
    name: "Mascotas",
    icon: PawPrint,
    subcategories: ["Accesorios", "Alimentación", "Higiene", "Transportines", "Otros"],
  },
  {
    name: "Servicios",
    icon: Wrench,
    subcategories: ["Reparaciones", "Mudanzas", "Clases", "Eventos", "Otros"],
  },
  {
    name: "Otros",
    icon: Shapes,
    subcategories: ["General"],
  },
];

const backdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

const sheet = {
  hidden: { y: 18, opacity: 0, scale: 0.985 },
  show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 520, damping: 34 } },
  exit: { y: 10, opacity: 0, transition: { duration: 0.14 } },
};

const RECENTS_KEY = "maqueti_recent_categories_v1";

const readRecents = () => {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => ({ category: String(x?.category || ""), subcategory: String(x?.subcategory || "") }))
      .filter((x) => x.category);
  } catch {
    return [];
  }
};

const writeRecents = (items) => {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(items.slice(0, 8)));
  } catch {
    undefined;
  }
};

const topSubcategories = (categoryName) => {
  const node = CATEGORY_TREE.find((c) => c.name === categoryName);
  if (!node) return [];
  const list = Array.isArray(node.subcategories) ? node.subcategories : [];
  return list.filter((s) => s && s !== "Otros").slice(0, 6);
};

export default function CategorySelector({ value, onChange, placeholder = "Categoría" }) {
  const rawCategory = String(value?.category || "").trim();
  const rawSub = String(value?.subcategory || "").trim();
  const parsed = useMemo(() => {
    if (rawSub) return { category: rawCategory, subcategory: rawSub };
    if (rawCategory.includes(" / ")) {
      const [c, s] = rawCategory.split(" / ");
      return { category: String(c || "").trim(), subcategory: String(s || "").trim() };
    }
    if (rawCategory.includes(" > ")) {
      const [c, s] = rawCategory.split(" > ");
      return { category: String(c || "").trim(), subcategory: String(s || "").trim() };
    }
    return { category: rawCategory, subcategory: "" };
  }, [rawCategory, rawSub]);

  const currentCategory = parsed.category || "";
  const currentSub = parsed.subcategory || "";
  const label = currentCategory ? (currentSub ? `${currentCategory} > ${currentSub}` : currentCategory) : "";

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const bodyRef = useRef(null);
  const searchRef = useRef(null);

  const selectedNode = useMemo(() => CATEGORY_TREE.find((c) => c.name === selectedCategory) || null, [selectedCategory]);
  const subcategories = selectedNode?.subcategories || [];
  const suggestions = useMemo(() => ["Tecnología", "Moda", "Motor", "Gaming", "Hogar", "Deporte"], []);

  const filteredCategories = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return CATEGORY_TREE;
    return CATEGORY_TREE.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      return (c.subcategories || []).some((s) => String(s).toLowerCase().includes(q));
    });
  }, [query]);

  const filteredSubcategories = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return subcategories;
    return subcategories.filter((s) => String(s).toLowerCase().includes(q));
  }, [query, subcategories]);

  useEffect(() => {
    if (!open) return;
    const baseCategory = currentCategory || "";
    setSelectedCategory(baseCategory);
    setStep(baseCategory ? 2 : 1);
    setQuery("");
    setRecent(readRecents());
    requestAnimationFrame(() => {
      bodyRef.current?.scrollTo?.({ top: 0 });
      searchRef.current?.focus?.();
    });
  }, [open, currentCategory]);

  const close = () => setOpen(false);
  const goBack = () => {
    setStep(1);
    setQuery("");
    requestAnimationFrame(() => {
      bodyRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
      searchRef.current?.focus?.();
    });
  };

  const pickCategory = (name) => {
    vibrate(10);
    setSelectedCategory(name);
    setStep(2);
    setQuery("");
    requestAnimationFrame(() => {
      bodyRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
      searchRef.current?.focus?.();
    });
  };

  const pickSubcategory = (sub) => {
    vibrate(15);
    const next = { category: selectedCategory, subcategory: sub };
    const nextRecents = [{ category: next.category, subcategory: next.subcategory }, ...recent.filter((x) => x.category !== next.category || x.subcategory !== next.subcategory)];
    setRecent(nextRecents.slice(0, 8));
    writeRecents(nextRecents);
    onChange?.({ category: selectedCategory, subcategory: sub });
    close();
  };

  const pickCategoryOnly = () => {
    vibrate(10);
    onChange?.({ category: selectedCategory, subcategory: "" });
    close();
  };

  const clear = () => {
    vibrate(10);
    onChange?.({ category: "", subcategory: "" });
  };

  const useRecent = (item) => {
    vibrate(10);
    setSelectedCategory(item.category);
    setStep(2);
    setQuery(String(item.subcategory || ""));
    requestAnimationFrame(() => {
      bodyRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
      searchRef.current?.focus?.();
    });
  };

  const useSuggestion = (name) => {
    vibrate(10);
    setSelectedCategory(name);
    setStep(2);
    setQuery("");
    requestAnimationFrame(() => {
      bodyRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
      searchRef.current?.focus?.();
    });
  };

  return (
    <>
      <button className={`cat-trigger ${label ? "filled" : ""}`} type="button" onClick={() => setOpen(true)}>
        <span className="cat-trigger-label">{label || placeholder}</span>
        <span className="cat-trigger-actions">
          {label ? (
            <span
              className="cat-clear"
              role="button"
              tabIndex={0}
              onClick={(e) => (e.preventDefault(), e.stopPropagation(), clear())}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  clear();
                }
              }}
              aria-label="Quitar"
            >
              <X size={18} />
            </span>
          ) : null}
          <ChevronRight size={18} />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div className="cat-root" initial="hidden" animate="show" exit="exit" variants={backdrop} role="dialog" aria-modal="true">
            <motion.button className="cat-backdrop" type="button" onClick={close} aria-label="Cerrar" />
            <motion.div className="cat-sheet" variants={sheet}>
              <div className="cat-topbar">
                {step === 2 ? (
                  <button className="cat-back" type="button" onClick={goBack} aria-label="Volver">
                    <ArrowLeft size={18} />
                  </button>
                ) : (
                  <div className="cat-back-spacer" />
                )}
                <div className="cat-titlewrap">
                  <div className="cat-title">Categorías</div>
                  <div className="cat-breadcrumb">
                    {step === 1 ? "Elige una categoría" : currentCategory === selectedCategory && currentSub ? `${selectedCategory} > ${currentSub}` : selectedCategory}
                  </div>
                </div>
                <button className="cat-close" type="button" onClick={close} aria-label="Cerrar">
                  <X size={18} />
                </button>
              </div>

              <div className="cat-body" ref={bodyRef}>
                <div className="cat-search">
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={step === 1 ? "Buscar categorías o subcategorías..." : "Buscar subcategoría..."}
                    inputMode="search"
                    autoComplete="off"
                  />
                  {query ? (
                    <button className="cat-search-clear" type="button" onClick={() => setQuery("")} aria-label="Limpiar">
                      <X size={18} />
                    </button>
                  ) : null}
                </div>
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.16 }}>
                      {recent.length ? (
                        <div className="cat-section">
                          <div className="cat-section-title">Recientes</div>
                          <div className="cat-chips">
                            {recent.map((r) => (
                              <button key={`${r.category}__${r.subcategory}`} className="cat-chip" type="button" onClick={() => useRecent(r)}>
                                <span className="cat-chip-top">{r.category}</span>
                                <span className="cat-chip-bottom">{r.subcategory || "—"}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="cat-section">
                        <div className="cat-section-title">Sugeridas</div>
                        <div className="cat-chips">
                          {suggestions.map((name) => (
                            <button key={name} className="cat-chip one" type="button" onClick={() => useSuggestion(name)}>
                              <span className="cat-chip-top">{name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="cat-grid">
                        {filteredCategories.map((c) => {
                          const Icon = c.icon;
                          const active = selectedCategory === c.name;
                          return (
                            <button key={c.name} className={`cat-card ${active ? "active" : ""}`} type="button" onClick={() => pickCategory(c.name)}>
                              <span className="cat-icon">
                                <Icon size={22} />
                              </span>
                              <span className="cat-name">{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      {filteredCategories.length === 0 ? <div className="cat-empty">No hay resultados</div> : null}
                    </motion.div>
                  ) : (
                    <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
                      {query ? null : (
                        <div className="cat-section">
                          <div className="cat-section-title">Top subcategorías</div>
                          <div className="cat-chips">
                            {topSubcategories(selectedCategory).map((s) => (
                              <button key={`top_${selectedCategory}_${s}`} className="cat-chip one" type="button" onClick={() => pickSubcategory(s)}>
                                <span className="cat-chip-top">{s}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="cat-section">
                        <div className="cat-section-title">Rápido</div>
                        <div className="cat-chips">
                          <button className="cat-chip one cat-chip-primary" type="button" onClick={pickCategoryOnly}>
                            <span className="cat-chip-top">Sin subcategoría</span>
                            <span className="cat-chip-bottom">{selectedCategory}</span>
                          </button>
                        </div>
                      </div>

                      <div className="cat-subgrid">
                        {filteredSubcategories.map((s) => {
                          const active = currentSub === s && currentCategory === selectedCategory;
                          return (
                            <button key={s} className={`cat-sub ${active ? "active" : ""}`} type="button" onClick={() => pickSubcategory(s)}>
                              <span className="cat-sub-name">{s}</span>
                              <ChevronRight size={18} />
                            </button>
                          );
                        })}
                      </div>
                      {filteredSubcategories.length === 0 ? <div className="cat-empty">No hay resultados</div> : null}

                      <div className="cat-footer">
                        <button className="cat-change" type="button" onClick={goBack}>
                          Cambiar categoría
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
