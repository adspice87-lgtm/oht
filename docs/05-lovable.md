# Przeniesienie Holuj do Lovable

Stack MVP to ten sam, którego używa Lovable: **React + Vite + TypeScript + Tailwind**. Logika (`src/lib/*`) przenosi się 1:1.

## Opcja A: zrobię to za Ciebie (rekomendowana)
Ta sesja ma podłączony konektor Lovable. Gdy powiesz „wrzucamy”, utworzę projekt w Twoim workspace, wyślę prompt startowy (poniżej) razem z plikami `src/lib/*` i ekranami, włączę Lovable Cloud (Supabase) i wkleję migrację `supabase/migrations/0001_init.sql`.

## Opcja B: ręcznie
1. W Lovable: **New project** i wklej **Prompt 1** (poniżej).
2. Połącz projekt z GitHubem (Lovable tworzy nowe repo). Skopiuj do niego `laweta-app/src/lib/*`, `src/screens/*` i `src/components/*` z tego repo. Lovable zsynchronizuje zmiany.
3. Kolejne kroki wysyłaj po jednym: Prompt 2, Prompt 3, Prompt 4. Jeden prompt to jedna funkcja, bo wtedy jest mniej błędów i mniej zużytych kredytów.

---

## Prompt 1: front (odtworzenie MVP)
```
Zbuduj mobilną aplikację PWA po polsku „Holuj” (slogan: „Laweta w minutę. Cena z góry.”) – marketplace łączący
kierowców z zepsutym autem z najbliższymi lawetami (pomoc drogowa). Dwie role w jednej apce: Klient i Laweciarz.

Styl: pomarańcz #FF7A00 (tekst na pomarańczowym w granacie #0E1A2B), granat #0E1A2B / #1A2A40, tło #F7F8FA,
sukces #1DB954, błąd #E5383B, font Inter 600–800, zaokrąglenia 14px, przyciski min. 56px (laweciarz 72–88px),
tryb ciemny automatycznie 19–7. Mapa: react-leaflet + kafelki CARTO Voyager / Dark.

KLIENT (cel: zamówienie < 60 s, bez konta):
1. Mapa z GPS + bottom sheet „Gdzie jesteś?”, licznik dostępnych lawet, CTA „Potrzebuję lawety”, link 112.
2. „Dokąd holujemy?” – wyszukiwarka adresów (Nominatim), szybkie cele, stuknięcie w mapę.
3. „Co się stało?” – kafle: Nie odpala / Awaria / Wypadek / Koło / Przewóz / Inne; typ: Osobowe, SUV/bus, Motocykl,
   Ciężkie; gdzie stoi: ulica, parking, autostrada, garaż podziemny (+wysokość), rów; przełączniki: koła się kręcą,
   kierownica się kręci, elektryk, 4x4/automat, obniżone, kluczyki; pasażerowie 0–2; marka/model.
4. „Lawety w pobliżu” – lista wg czasu dojazdu: firma, ocena, typ lawety, „Zweryfikowany”, cena całkowita, ETA,
   znaczniki NAJSZYBCIEJ / NAJTANIEJ, rozwijane „Z czego składa się cena?”. CTA „Zamów · {cena} zł”.
5. Numer telefonu (+ imię), info „Cena zablokowana”.
6. Śledzenie: laweta na mapie, statusy („Laweta jedzie do Ciebie · 12 min”, „Laweta na miejscu”, „Ładujemy Twoje auto”,
   „W drodze do celu · 8 min”, „Gotowe. Do zapłaty: 250 zł”), Zadzwoń, Anuluj, ocena 1–5.

LAWECIARZ:
1. Dyżur: ogromny przełącznik „JESTEM DOSTĘPNY”, dziś zleceń / zarobek.
2. Nowe zlecenie na pełny ekran, odliczanie 30 s, cena, dojazd km/min, adresy, tagi pojazdu (ostrzeżenia na czerwono),
   przyciski „Nie” i „BIORĘ”.
3. Zlecenie w toku: mapa, jeden duży przycisk kolejnego kroku (Jadę → Jestem na miejscu → Zaczynam załadunek →
   Auto załadowane – jadę → Zakończ), Nawiguj (Google Maps deep link), Zadzwoń do klienta,
   protokół 4 zdjęć wymagany przed transportem.
4. Cennik: opłata startowa, zł/km z autem, km dojazdu gratis, zł/km dojazdu, cena minimalna, mnożnik nocny i weekendowy,
   dopłaty (autostrada, nie toczy się, garaż podziemny, SUV/bus, rów od, postój/15 min) + podgląd przykładowej ceny.
5. Zarobki / historia.

Wzór ceny (src/lib/pricing.ts):
suma = start + max(0, km_dojazdu − km_gratis) × zł/km_dojazdu + km_z_autem × zł/km + dopłaty;
mnożnik = najwyższy aktywny (noc/weekend), nie mnożymy; cena = ceil(max(min, suma × mnożnik)/10)*10.
Domyślnie: start 150, gratis 10 km, dojazd 2,5 zł/km, z autem 4 zł/km, min 250, noc ×1,3, weekend ×1,2,
autostrada 100, nie toczy się 80, garaż 120, SUV/bus 80, rów 250, postój 40/15 min.

Na razie dane mockowe (8 lawet w Warszawie). W headerze przełącznik Klient / Laweciarz.
```

## Prompt 2: backend (Lovable Cloud / Supabase)
```
Włącz Lovable Cloud. Wykonaj migrację z pliku supabase/migrations/0001_init.sql (PostGIS, tabele profiles, drivers,
vehicles, pricing, driver_locations, jobs, job_events, job_photos, reviews, RLS, RPC nearby_drivers).
Zastąp mockowy store: lista lawet = RPC nearby_drivers(lat,lng,radius_km,vehicle_type), zamówienie = insert do jobs,
statusy = update jobs + insert job_events, a widok klienta i laweciarza subskrybuje zmiany przez Supabase Realtime.
```

## Prompt 3: logowanie i weryfikacja
```
Dodaj logowanie SMS OTP (Supabase Auth, phone). Klient: OTP przy pierwszym zamówieniu. Laweciarz: onboarding –
firma, NIP, nr rej. lawety, typ lawety, ładowność, zdjęcie lawety, polisa OC/OCPD (upload do Storage).
Status weryfikacji ustawia admin. Dodaj prosty panel /admin z listą laweciarzy do zatwierdzenia i listą zleceń.
```

## Prompt 4: lokalizacja na żywo i powiadomienia
```
Laweciarz online: navigator.geolocation.watchPosition co ~10 s → upsert do driver_locations (tylko gdy is_online).
Klient śledzi pozycję lawety przez Realtime. Web Push dla nowego zlecenia u laweciarza (z dźwiękiem) + fallback SMS.
```
