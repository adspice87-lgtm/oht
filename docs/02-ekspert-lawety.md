# 02 — Wiedza branżowa: pomoc drogowa i lawety (PL)

> Notatka praktyka do MVP „Uber dla lawet”. Stawki to orientacyjne rynkowe zakresy PL (2026), nie cennik obowiązujący.

## 1. Typy pojazdów pomocy drogowej

| Kod | Typ | Do czego | Ograniczenia |
|---|---|---|---|
| `flatbed_light` | Laweta płaska/najazdowa ≤3,5 t (najczęstsza, kat. B) | Osobówki, auta niejezdne, elektryki, automaty, 4x4 | **Ładowność realnie ~1,2–1,6 t.** Duży SUV, Tesla, van to często przeciążenie. Obniżone auta wymagają platformy zsuwanej (niski kąt) lub najazdów przedłużanych |
| `flatbed_heavy` | Laweta 5–12 t (kat. C1/C) | SUV-y, busy do 3,5 t, kampery, lekkie maszyny | Większa, nie wjedzie w ciasne miejsca ani pod niskie bramy |
| `wheel_lift` | Pomoc kołowa / holownik z wysięgnikiem (podnosi jedną oś) | Szybkie ściąganie z ulicy, parkingi, auta z zablokowanymi kołami (z wózkami) | **Nie dla elektryków, 4x4/AWD, automatów na długi dystans** (koła napędowe na ziemi niszczą skrzynię/silnik). Uszkodzony przód/tył wyklucza. Wymaga sprawnej osi, która toczy się |
| `flatbed_crane` | Laweta z HDS (żurawiem) | Auta z rowu, ze skarpy, przewrócone, w miejscach bez najazdu | Droższa; operator HDS z uprawnieniami UDT |
| `double_deck` | Laweta 2-poziomowa / z przyczepą | 2 auta naraz, przewozy planowe (komisy, salony) | Nie do pilnych akcji; wysokość ~4 m. W MVP raczej jako `flatbed_heavy` |
| `heavy_recovery` | Ciężka pomoc (TIR, autobus, >3,5 t) | Ciągniki, naczepy, autobusy, maszyny | Inny rynek, wycena indywidualna, w MVP **poza zakresem** (tylko lead) |
| `moto` | Motocykle (zwykle laweta płaska z uchwytem na koło) | Motocykle, quady, skutery | Potrzebny uchwyt na przednie koło i pasy; nigdy nie holować na kole |

**Reguły dopasowania (auto-filtr w apce):**
- elektryk, hybryda plug-in, 4x4/AWD, automat i dystans >20 km wymagają lawety płaskiej (`flatbed_*`), wykluczamy `wheel_lift`
- masa holowanego >1,6 t (SUV, van, EV) daje `flatbed_heavy` lub lawetę lekką z deklarowaną ładownością ≥ masa
- obniżone auto: laweta musi mieć flagę `low_angle`
- rów/skarpa/dach wymaga `flatbed_crane` albo wyciągarki, a cena tylko „od” z dopłatą potwierdzaną na miejscu
- parking podziemny: laweta zwykle nie wjedzie (garaże 1,9–2,2 m, laweta 2,5–3 m). Auto trzeba wyciągnąć wózkami/wyciągarką na zewnątrz, więc liczy się to jako dopłata i laweciarz musi mieć flagę `dollies`

## 2. Formularz zgłoszenia (minimum MVP)

| Pole | Typ | Wartości / uwagi |
|---|---|---|
| `pickup_location` | geo + adres | GPS z telefonu + korekta pinezki; pole „opis miejsca” (np. „za stacją Orlen, pas awaryjny”) |
| `dropoff_location` | geo + adres | warsztat / dom / ASO / „nie wiem, najbliższy warsztat” |
| `vehicle_category` | select | `car`, `suv_van` (do 3,5 t), `moto`, `heavy` (>3,5 t, tylko lead) |
| `make_model` | text | np. „Skoda Octavia” (opcjonalnie rocznik) |
| `drivetrain_flags` | checkbox | `electric`, `automatic`, `awd_4x4`, `lowered` |
| `rolls` | select | `yes`, `no_wheels_locked` (koła się nie kręcą: skrzynia, ręczny, urwane koło), `unknown` |
| `steers` | select | `yes`, `no`, `unknown` |
| `cause` | select | `breakdown`, `accident`, `no_start_battery`, `flat_tire`, `other` |
| `location_type` | select | `street`, `parking`, `underground_garage`, `highway_expressway`, `offroad_ditch` |
| `garage_height_cm` | number | tylko gdy `underground_garage` (wymagane) |
| `passengers` | select | `0`, `1`, `2` (laweta lekka ma zwykle 2 miejsca obok kierowcy; więcej oznacza osobny transport) |
| `keys_available` | checkbox | domyślnie tak; brak kluczyków zwykle oznacza zablokowaną kierownicę/skrzynię |
| `owner_present` | checkbox | czy ktoś będzie przy aucie (jeśli nie, potrzebny kontakt + ustalenie oddania kluczyka) |
| `when` | select | `now`, `scheduled` + datetime |
| `photos` | file[] | opcjonalnie 1–3 zdjęcia auta/miejsca (przy wypadku/rowie mocno zalecane) |
| `phone` | tel | wymagane, weryfikacja SMS |
| `notes` | textarea | wolny tekst |

Dowód rejestracyjny nie jest polem formularza. Laweciarz sprawdza na miejscu, czy zleceniodawca jest uprawniony (dowód rej. + dowód osobisty), co chroni przed holowaniem cudzego auta.

## 3. Model cenowy

**Składowe w realu:** opłata startowa (załadunek, wyjazd), km dojazdu, km z autem, dopłaty czasowe (noc/weekend/święto), lokalizacja (autostrada/S, garaż podziemny), trudny załadunek (nie toczy się, wózki, rów, wyciągarka), postój/oczekiwanie, pojazd cięższy.

**Pola cennika laweciarza (wszystkie z domyślnymi, edytowalne):**

| Pole | Domyślnie | Typowy zakres PL |
|---|---|---|
| `base_fee` (start + załadunek) | 150 zł | 100–250 zł |
| `approach_free_km` | 10 km | 0–20 km |
| `approach_rate_km` (dojazd) | 2,50 zł/km | 2–4 zł/km |
| `tow_rate_km` (z autem) | 4,50 zł/km | 3,5–7 zł/km |
| `min_price` | 250 zł | 200–350 zł (miasto) |
| `night_mult` (22:00–6:00) | 1,3 | 1,2–1,5 |
| `weekend_mult` (sob–nd) | 1,2 | 1,0–1,3 |
| `holiday_mult` (święta ustawowe) | 1,5 | 1,3–2,0 |
| `sur_highway` (A/S) | 100 zł | 50–200 zł |
| `sur_not_rolling` (wózki/wciąganie) | 80 zł | 50–150 zł |
| `sur_underground` | 120 zł | 100–250 zł |
| `sur_suv_van` (2–3,5 t) | 80 zł | 50–150 zł |
| `sur_ditch` (rów/wyciągarka, „od”) | 250 zł | 150–600 zł+ |
| `wait_free_min` | 15 min | 15–30 min |
| `wait_rate_15min` | 40 zł | 30–60 zł |

**Wzór (cena szacunkowa pokazywana klientowi):**

```
km_dojazdu_platne = max(0, km_dojazdu - approach_free_km)
suma = base_fee
     + km_dojazdu_platne * approach_rate_km
     + km_z_autem       * tow_rate_km
     + suma_doplat_z_formularza          // highway, not_rolling, underground, suv_van, ditch
mnoznik = max(night_mult?, weekend_mult?, holiday_mult?, 1.0)   // NIE mnożymy przez siebie
cena = ceil( max(min_price, suma * mnoznik) / 10 ) * 10
```

- `km_dojazdu` liczone z bieżącego GPS lawety do klienta, `km_z_autem` trasą (routing API), nie w linii prostej.
- Postój nie wchodzi w cenę z góry. Naliczany automatycznie przez apkę po `wait_free_min` od statusu „na miejscu”, widoczny dla klienta na żywo.
- **Przykład 1 (dzień, miasto):** dojazd 8 km, z autem 15 km: 150 + 0 + 67,5 = 217,5, poniżej minimum, więc **250 zł**.
- **Przykład 2 (noc, nie toczy się):** dojazd 25 km, z autem 40 km: 150 + 37,5 + 180 + 80 = 447,5 × 1,3 = 581,75, po zaokrągleniu **590 zł**.

## 4. Statusy zlecenia

| Kod | Etykieta | Kto zmienia |
|---|---|---|
| `requested` | Nowe – szukamy lawety | system |
| `accepted` | Przyjęte | laweciarz |
| `en_route` | W drodze (ETA na żywo) | laweciarz |
| `on_site` | Na miejscu (start liczenia postoju) | laweciarz (+ geofence) |
| `loading` | Załadunek (protokół zdjęciowy wymagany przed przejściem dalej) | laweciarz |
| `in_transit` | W transporcie | laweciarz |
| `delivered` | Dostarczone (zdjęcia + podpis/potwierdzenie) | laweciarz |
| `settled` | Rozliczone (zapłacono, ocena) | laweciarz/system |
| `cancelled_client` / `cancelled_driver` / `no_show` | Anulowane | strona + powód |

**Ekran laweciarza w trakcie jazdy:** jeden duży przycisk „następny status” (min. 60 px, obsługa w rękawicach), przycisk **Nawiguj** (deep link Google Maps / Waze, wybór zapamiętany), **Zadzwoń do klienta** (w przyszłości numer maskowany), adres + opis miejsca + zdjęcia od klienta, kluczowe flagi dużymi ikonami (EV, nie toczy się, garaż X cm, 2 pasażerów), cena zablokowana + licznik postoju. Tryb ciemny, ekran nie gaśnie, minimum pisania.

## 5. Problemy i oszustwa: jak apka ma je ograniczać

| Problem | Zabezpieczenie |
|---|---|
| Klient rezygnuje, bo auto „odpaliło” albo znalazł tańszą lawetę | Darmowe anulowanie do `accepted` + 3 min; potem opłata za fatygę (np. 50% `base_fee` + dojazd). W MVP: rejestr anulacji + ocena; płatność później |
| Fałszywe zgłoszenia / żarty | Weryfikacja SMS, limit aktywnych zleceń na numer, blokada numeru po `no_show` |
| Laweciarz zawyża cenę na miejscu | **Cena zablokowana** przy akceptacji. Zmiana tylko o zdefiniowane dopłaty (rów, postój, niezgodność z formularzem) i **tylko po akceptacji klienta w apce** + zdjęcie uzasadniające |
| Klient zataił stan (nie toczy się, SUV, garaż) | Dopłata z cennika „niezgodność z opisem” + zdjęcie; powtarzające się przypadki obniżają ocenę klienta |
| „Sępy” pod wypadkami (podjeżdżają bez wezwania, wymuszają holowanie na swój plac, potem horrendalny parking) | Klient widzi w apce zdjęcie, nazwisko, numer rejestracyjny lawety. Komunikat „nie oddawaj auta nikomu innemu”. Cel zawsze wskazuje klient, nie laweciarz |
| Spór o uszkodzenia | **Protokół zdjęciowy przed załadunkiem** (min. 4 rogi + licznik/deska, znacznik czasu i GPS, tylko z aparatu, nie z galerii) i przy wydaniu; podpis/akceptacja klienta w apce |
| Słaba jakość usług | Oceny dwustronne, zawieszenie poniżej progu |
| Lawety „bez papierów” | Weryfikacja NIP + polisy OC/OCPD przed aktywacją (pkt 6) |

Uwaga praktyczna: na odcinkach koncesyjnych autostrad (np. A1 Rusocin–Toruń, A2 Konin–Świecko, A4 Katowice–Kraków) holowanie zwykle realizuje operator wskazany przez koncesjonariusza/służby. Apka powinna ostrzec klienta i laweciarza (do zweryfikowania prawnie). Holowania z polecenia Policji (art. 130a PRD) to osobny tryb, poza MVP.

## 6. Wymogi formalne: co weryfikować

**MVP (przy rejestracji, ręczna akceptacja przez admina):**
- NIP + sprawdzenie w CEIDG/KRS (firma aktywna; PKD 52.21.Z lub 49.41.Z)
- polisa **OC komunikacyjne lawety** + **OC działalności / OCPD (OC przewoźnika)** z sumą i datą ważności (skan; przypomnienie przed wygaśnięciem). OCPD nie jest obowiązkowe w kraju, ale w tej branży to standard i chroni klienta przy szkodzie w transporcie
- dowód rejestracyjny lawety: nr rej., DMC, **ładowność**, przeznaczenie „pomoc drogowa” (do dopasowania typu z pkt 1)
- prawo jazdy kierowcy: kat. **B** (laweta ≤3,5 t), **C1/C** (powyżej), **+E** przy przyczepie; zdjęcie kierowcy i lawety
- oświadczenie o posiadaniu ostrzegawczych świateł błyskowych (pomarańczowych/żółtych) i wyposażenia (pasy, wózki, wyciągarka)

**Później:**
- uprawnienia **UDT na HDS** (operator) + ważny dozór UDT urządzenia, gdy laweta oznaczona jako `flatbed_crane`
- licencja/zezwolenie na wykonywanie zawodu przewoźnika drogowego dla pojazdów >3,5 t; tachograf (pomoc drogowa ma wyłączenia w promieniu ~100 km, do sprawdzenia)
- automatyczna weryfikacja przez API (CEIDG, biała lista VAT), KYC kierowców, badania lekarskie/psychotesty dla kat. C
- umowy z assistance i flotami

## 7. Funkcje MVP

**Laweciarz, must have:**
1. Przełącznik „Jestem w pracy / Offline” (online = udostępnianie GPS)
2. Profil lawety: typ, ładowność, flagi (`low_angle`, `dollies`, `winch`, liczba miejsc)
3. Cennik z domyślnymi wartościami (pkt 3), edycja w 1 ekranie
4. Powiadomienie push z dźwiękiem o zleceniu w promieniu X km: trasa, flagi, **jego cena wyliczona z jego cennika**, licznik czasu na akceptację (np. 60 s)
5. Przyjmij / Odrzuć jednym tapnięciem
6. Ekran zlecenia z dużymi przyciskami statusów
7. Nawigacja (Google Maps/Waze) + telefon do klienta
8. Protokół zdjęciowy przy załadunku i wydaniu
9. Licznik postoju + dopłaty z akceptacją klienta
10. Historia zleceń i dzienny utarg

**Klient, must have:**
1. Zgłoszenie bez zakładania konta (telefon + SMS)
2. Automatyczna lokalizacja + korekta pinezki + opis miejsca
3. Krótki formularz (pkt 2) z ikonami, max ~1 minuta
4. Lista dostępnych lawet: odległość/ETA, **cena z góry**, ocena, typ
5. Wybór lawety (lub „najszybsza”)
6. Śledzenie lawety na mapie + ETA
7. Dane laweciarza: imię, zdjęcie, nr rej., telefon
8. Podgląd zablokowanej ceny i ewentualnych dopłat do akceptacji
9. Protokół zdjęciowy do wglądu + potwierdzenie odbioru
10. Ocena i komentarz po zleceniu

**Czego NIE robić w MVP:**
- płatności w apce, prowizji, faktur (płatność gotówką/BLIK/kartą bezpośrednio u laweciarza, apka tylko zapisuje kwotę)
- ciężkiej pomocy (TIR/autobusy) poza zbieraniem leadów
- integracji z assistance/ubezpieczycielami i likwidacji szkód
- licytacji/negocjacji cen (to zabija „cenę z góry”)
- dyspozytorni wielu kierowców/flot (najpierw jednoosobowe firmy; flota później)
- czatu (telefon wystarczy), maskowania numerów, rozbudowanego KYC
- dynamicznego „surge pricing” po stronie platformy: cenę ustala laweciarz
