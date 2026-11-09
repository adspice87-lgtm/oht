/**
 * Model zarabiania Holuj (MVP):
 * - laweciarz ma portfel (przedpłata), klient płaci laweciarzowi normalnie
 * - przy PRZYJĘCIU zlecenia z portfela schodzi prowizja: 10% ceny, min. 25 zł
 * - anulowanie przez laweciarza po przyjęciu: prowizja nie wraca + kara 50 zł + spadek oceny
 * - bez środków w portfelu laweciarz nie przyjmie zlecenia (nie może „olać” systemu i brać klientów bokiem,
 *   bo klient nie widzi jego numeru – kontakt tylko w aplikacji)
 */
export const FEE_PCT = 10;
export const FEE_MIN = 25;
export const CANCEL_PENALTY = 50;
export const START_BONUS = 100; // demo: saldo startowe po rejestracji laweciarza
export const TOPUPS = [100, 200, 500];

export const platformFee = (price: number) => Math.max(FEE_MIN, Math.round((price * FEE_PCT) / 100));
