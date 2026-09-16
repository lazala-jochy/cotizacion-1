export function formatPhoneDO(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)]
  return groups.filter(Boolean).join('-')
}

// RNC (empresa, 9 dígitos: XXX-XXXXX-X) o cédula (persona física, 11 dígitos: XXX-XXXXXXX-X).
// Mientras se escribe, se asume RNC hasta que se superan los 9 dígitos.
export function formatTaxId(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length > 9) {
    const groups = [digits.slice(0, 3), digits.slice(3, 10), digits.slice(10, 11)]
    return groups.filter(Boolean).join('-')
  }
  const groups = [digits.slice(0, 3), digits.slice(3, 8), digits.slice(8, 9)]
  return groups.filter(Boolean).join('-')
}
