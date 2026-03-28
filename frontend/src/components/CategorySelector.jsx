import React, { useEffect, useMemo, useState } from "react";
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

export default function CategorySelector({ value, onChange, placeholder = "Categoría" }) {
  const currentCategory = value?.category || "";
  const currentSub = value?.subcategory || "";
  const label = currentCategory ? (currentSub ? `${currentCategory} > ${currentSub}` : currentCategory) : "";

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");

  const selectedNode = useMemo(() => CATEGORY_TREE.find((c) => c.name === selectedCategory) || null, [selectedCategory]);
  const subcategories = selectedNode?.subcategories || [];

  useEffect(() => {
    if (!open) return;
    const baseCategory = currentCategory || "";
    setSelectedCategory(baseCategory);
    setStep(baseCategory ? 2 : 1);
  }, [open, currentCategory]);

  const close = () => setOpen(false);
  const goBack = () => setStep(1);

  const pickCategory = (name) => {
    vibrate(10);
    setSelectedCategory(name);
    setStep(2);
  };

  const pickSubcategory = (sub) => {
    vibrate(15);
    onChange?.({ category: selectedCategory, subcategory: sub });
    close();
  };

  const clear = () => {
    vibrate(10);
    onChange?.({ category: "", subcategory: "" });
  };

  return (
    <>
      <button className={`cat-trigger ${label ? "filled" : ""}`} type="button" onClick={() => setOpen(true)}>
        <span className="cat-trigger-label">{label || placeholder}</span>
        <span className="cat-trigger-actions">
          {label ? (
            <span className="cat-clear" role="button" tabIndex={0} onClick={(e) => (e.preventDefault(), e.stopPropagation(), clear())} aria-label="Quitar">
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
                  <div className="cat-breadcrumb">{step === 1 ? "Elige una categoría" : `${selectedCategory} >`}</div>
                </div>
                <button className="cat-close" type="button" onClick={close} aria-label="Cerrar">
                  <X size={18} />
                </button>
              </div>

              <div className="cat-body">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.16 }}>
                      <div className="cat-grid">
                        {CATEGORY_TREE.map((c) => {
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
                    </motion.div>
                  ) : (
                    <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
                      <div className="cat-subgrid">
                        {subcategories.map((s) => {
                          const active = currentSub === s && currentCategory === selectedCategory;
                          return (
                            <button key={s} className={`cat-sub ${active ? "active" : ""}`} type="button" onClick={() => pickSubcategory(s)}>
                              <span className="cat-sub-name">{s}</span>
                              <ChevronRight size={18} />
                            </button>
                          );
                        })}
                      </div>

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
