/**
 * Model zarabiania holuj! – TOKENY (1 token = 1 zł):
 * - laweciarz kupuje tokeny (przedpłata); klient płaci laweciarzowi normalnie całą kwotę
 * - ODBLOKOWANIE (przyjęcie) zlecenia kosztuje stałe 50 tokenów, niezależnie od ceny kursu
 * - 100 tokenów na start dopiero po weryfikacji: NIP/OC + zdjęcie naklejki holuj! na lawecie
 * - bez tokenów laweciarz nie przyjmie zlecenia
 * - zwrot tokenów, gdy klient anuluje po przyjęciu (laweciarz nie płaci za cudzą rezygnację)
 * - anulowanie przez laweciarza po przyjęciu: tokeny nie wracają + kara 50 tokenów + spadek oceny
 */
export const TOKEN_PLN = 1;
export const UNLOCK_COST = 50;
export const START_TOKENS = 100;
export const CANCEL_PENALTY = 50;

/** Pakiety tokenów (bonus za większy pakiet – zachęta do przedpłaty). */
export const PACKAGES = [
  { tokens: 100, price: 100, bonus: 0 },
  { tokens: 300, price: 300, bonus: 30 },
  { tokens: 500, price: 500, bonus: 75 },
];

export const tk = (n: number) => `${Math.round(n).toLocaleString("pl-PL")} tok.`;
