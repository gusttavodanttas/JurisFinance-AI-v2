export const formatCurrency = (
  val: number,
  options?: Intl.NumberFormatOptions
): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    ...options,
  }).format(val);
