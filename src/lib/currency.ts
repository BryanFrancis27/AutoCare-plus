const phpCurrencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrencyPHP(amount: number | null | undefined): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "₱0";
  }

  return phpCurrencyFormatter.format(amount).replace("PHP", "₱").replace(/₱\s+/, "₱").trim();
}
