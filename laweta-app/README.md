# holuj! — MVP („Uber dla lawet”)

> Laweta w minutę. Cena z góry.

Klient w ~4 tapnięciach widzi najbliższe wolne lawety z **ceną całkowitą z góry** i czasem dojazdu, zamawia bez konta (sam numer telefonu) i śledzi lawetę na mapie.
Laweciarz nic nie montuje — odpala apkę na telefonie, klika **„JESTEM DOSTĘPNY”**, ustawia swój cennik (start, zł/km, minimum, mnożniki, dopłaty) i przyjmuje zlecenia jednym dużym przyciskiem.

## Role i zarabianie
- Każdy startuje jako **klient**. W **Ustawieniach (⚙️) → „Zostań laweciarzem”**: imię operatora, typ lawety, nr rej., ładowność, NIP, akceptacja regulaminu. Potem w Ustawieniach przełącza się tryb Klient / Laweciarz.
- Klient **nie widzi profili firm ani telefonów**: tylko typ lawety, operatora (imię + ocena), ładowność, **Wolna / Zajęta**, ETA i cenę. Zaznacza wolną lawetę → zlecenie i **wiadomości idą w aplikacji**.
- **Prowizja Holuj:** 10% ceny (min. 25 zł) schodzi z portfela laweciarza w chwili przyjęcia zlecenia. Bez środków nie przyjmie zlecenia. Anulowanie po przyjęciu: kara 50 zł, prowizja nie wraca, ocena −0,3. Stałe w `src/lib/fees.ts`.

## Uruchomienie
```bash
cd laweta-app
npm install
npm run dev        # http://localhost:5173
```
- Demo: zostań laweciarzem, włącz dyżur, przełącz na Klienta i zaznacz lawetę „operator: Ty (demo)”, potem wróć na Laweciarza i kliknij BIORĘ. Pozostałe (mockowe) lawety same akceptują, odpisują na czacie i jadą (czas skrócony: 1 min = 1 s).
- Na desktopie: Ustawienia → „oba telefony obok siebie”. Działa też w dwóch kartach (synchronizacja przez BroadcastChannel).

## Co jest w MVP
| Klient | Laweciarz |
|---|---|
| Auto-GPS, poprawka stuknięciem w mapę | Przełącznik dyżuru (lokalizacja tylko gdy online) |
| Cel: wyszukiwarka adresów (OSM) / szybkie cele / mapa | Pełnoekranowe zlecenie, 30 s na decyzję, „BIORĘ / Nie” (Nie → przekazanie dalej) |
| Formularz: co się stało, typ auta, gdzie stoi, toczy się, elektryk, 4x4, obniżone, pasażerowie | Jeden przycisk prowadzący przez statusy, „Nawiguj” (Google Maps), „Zadzwoń” |
| Lista lawet wg ETA, znaczniki NAJSZYBCIEJ/NAJTANIEJ, rozbicie ceny | Protokół zdjęciowy (4 zdjęcia) wymagany przed transportem |
| Cena zablokowana, zamówienie bez konta | Edytor cennika z podglądem ceny |
| Śledzenie lawety + statusy, anulowanie, ocena | Zarobki / historia |

Dopasowanie lawety do zgłoszenia (`truckFits`) i wzór ceny (`quote`) są w `src/lib/pricing.ts`:
```
suma    = start + max(0, km_dojazdu − km_gratis) × zł/km_dojazdu + km_z_autem × zł/km + dopłaty
mnożnik = najwyższy aktywny (noc 22–6 / weekend) — nie mnożymy przez siebie
cena    = ceil(max(minimalna, suma × mnożnik) / 10) × 10
```

## Struktura
```
src/lib/geo.ts       odległości, ETA, geokodowanie (Nominatim)
src/lib/pricing.ts   cennik, wzór ceny, reguły dopasowania lawet
src/lib/store.ts     stan (localStorage + BroadcastChannel) + symulacja → docelowo Supabase
src/lib/mock.ts      przykładowe lawety w Warszawie
src/lib/copy.ts      teksty / statusy
src/screens/         ClientApp, DriverApp
src/components/      MapView (Leaflet), UI
```

## Dokumentacja zespołu ekspertów
- `../docs/01-research-rynku.md` — konkurencja, ceny, wielkość rynku, monetyzacja, ryzyka
- `../docs/02-ekspert-lawety.md` — typy lawet, pola zgłoszenia, cennik, statusy, oszustwa, wymogi formalne
- `../docs/03-architektura.md` + `../supabase/migrations/0001_init.sql` — docelowa architektura, schemat bazy, RLS, matching, realtime
- `../docs/04-produkt-ux-growth.md` — nazwa, paleta, ekrany, mikrocopy, go-to-market, KPI, landing
- `../docs/05-lovable.md` — jak przenieść do Lovable (prompty)

## Ograniczenia MVP (świadome)
Brak backendu (dane w przeglądarce), odległości szacowane (linia prosta × 1,3), brak SMS/OTP, płatność u kierowcy, mapy na kafelkach CARTO/OSM.
