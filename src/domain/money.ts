/** "$150", "$1,545", or "$97.50": whole dollars stay tidy and cents only appear when there are some. */
export function formatMoney(amount: number): string {
  const digits = Number.isInteger(amount) ? 0 : 2
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits })
}
