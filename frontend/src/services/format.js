export const priceLabel = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "—";
  return `${Number(value)} €`;
};
