export function formatCOP(amount: number): string {
  return `$${amount.toLocaleString("es-CO")}`;
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatAccountType(type: string): string {
  const types: Record<string, string> = {
    savings: "Ahorros",
    checking: "Corriente",
    credit_card: "Tarjeta de Credito",
  };
  return types[type] || type;
}

export function maskAccount(number: string): string {
  if (number.length <= 4) return number;
  return "****" + number.slice(-4);
}
