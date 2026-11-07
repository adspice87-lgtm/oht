# 04 — Produkt, UX i growth (MVP „Uber dla lawet”)

## 1. Nazwa, slogan, styl

| Nazwa | Slogan | Uwagi |
|---|---|---|
| **Holuj** | „Laweta w minutę. Cena z góry.” | Czasownik, 2 sylaby, mówi co robi. Brak dużej marki o tej nazwie; lokalne firmy używają „Holujemy”, więc przed startem sprawdzić domenę i UPRP. |
| Lawetka | „Najbliższa laweta, jednym palcem.” | Ciepła, ale zdrobnienie słabo pasuje do wypadku, a słowo jest generyczne i trudne do zastrzeżenia. |
| Pobocze | „Stoisz? Zaraz ktoś jedzie.” | Nazwa mocno kojarzy się z sytuacją, ale ma negatywny wydźwięk. |
| HakPomoc | „Pomoc drogowa bez szukania.” | „Hak” w PL kojarzy się też z „mieć na kogoś haka”. |
| LawetaGo | „Zamów lawetę jak taksówkę.” | Dobre pod SEO, ale „Go” kojarzy się z Bolt/Uber i brzmi wtórnie. |

**Rekomendacja: Holuj** — krótka, łatwa do powiedzenia przez telefon („holuj kropka pe el”), działa jako wezwanie („Holuj!”). Pod SEO budujemy podstrony „laweta [miasto]”, więc nazwa marki nie musi zawierać słowa „laweta”.

**Paleta (motyw „sygnalizator lawety nocą”):**

| Token | HEX | Użycie |
|---|---|---|
| `primary` (pomarańcz ostrzegawczy) | `#FF7A00` | Główne CTA, marker lawety, akcenty |
| `primary-pressed` | `#E06500` | Stan wciśnięty |
| `navy` (tło nocne / tekst dzienny) | `#0E1A2B` | Tło trybu ciemnego, nagłówki w jasnym |
| `navy-surface` | `#1A2A40` | Karty w trybie ciemnym |
| `light-bg` | `#F7F8FA` | Tło trybu jasnego |
| `text-on-primary` | `#0E1A2B` | Tekst na pomarańczowym (kontrast ~7:1; biały ma tylko ~2.9:1) |
| `success` | `#1DB954` | „Laweta na miejscu”, online |
| `danger` | `#E5383B` | Anuluj, 112, błędy |
| `muted` | `#8A97A8` | Teksty pomocnicze |

Styl: duże zaokrąglone przyciski (radius 14px), font Inter / Manrope 600–800, ikony liniowe grube (2px), zero dekoracji. Domyślnie tryb ciemny od 19:00 do 7:00 lub według ustawień systemu.

## 2. Mapa ekranów MVP

### Klient (bez instalacji: PWA/web + później app)
1. **Start / Gdzie jesteś?** — mapa z pinezką ustawioną z GPS, adres pod spodem („A2, km 152, kier. Warszawa”), CTA **„Potrzebuję lawety”**. Mniejsze przyciski: „Zmień miejsce”, „Zadzwoń do nas”, na dole link „Wypadek z rannymi? Dzwoń 112”.
2. **Co się stało?** — 4 duże kafle: *Nie odpala / Wypadek / Koło-opona / Inne*. Typ auta: *Osobowe / SUV-dostawcze do 3,5 t / Motocykl* (domyślnie osobowe). Opcjonalnie: „Dokąd holować?” (domyślnie „Najbliższy warsztat / ustalę z kierowcą”).
3. **Lawety w pobliżu** — lista posortowana wg ETA: nazwa firmy, ocena, **cena całkowita z góry**, ETA, odległość. Najlepsza oferta przypięta na górze z CTA **„Zamów · 280 zł”**.
4. **Numer telefonu** — jedno pole + kod SMS (autouzupełnianie OTP). Bez konta i bez hasła.
5. **Śledzenie** — mapa z lawetą, status, ETA, zdjęcie auta i nr rej. lawety, duży przycisk **„Zadzwoń do kierowcy”**, mały „Anuluj”.
6. **Zakończenie** — podsumowanie ceny, płatność (gotówka/karta u kierowcy w MVP), ocena 1–5 gwiazdek jednym tapnięciem.

**Happy path (cel: <60 s, 4 tapnięcia + SMS):**
1. Otwiera link/apkę → GPS sam ustawia lokalizację → tap **„Potrzebuję lawety”** (1).
2. Tap kafla „Nie odpala” (2) — typ auta „Osobowe” zostaje domyślny.
3. Widzi listę → tap **„Zamów · 280 zł”** na pierwszej ofercie (3).
4. Wpisuje numer (klawiatura numeryczna), kod SMS wypełnia się sam → **„Potwierdź”** (4).
5. Śledzenie startuje automatycznie.

Zamówienie bez rejestracji, tylko z numerem telefonu, to w MVP **obowiązek**: numer weryfikuje klienta (antyspam), daje kierowcy kontakt, a konto zakładamy po cichu w tle. Przy kolejnym zamówieniu numer jest zapamiętany.

### Lawециarz
1. **Logowanie** — numer telefonu + SMS. Onboarding: firma, NIP (opcjonalnie), typ lawety, nr rej., zdjęcie pojazdu.
2. **Stawki** — 3 pola z dużymi +/–: *Opłata startowa (zł)*, *Za km (zł)*, *Dopłata nocna (%)*. Podgląd „Przykład: 15 km = 255 zł”.
3. **Główny (Dyżur)** — ogromny przełącznik **„JESTEM DOSTĘPNY”** (zielony/szary), dzisiejsze zlecenia i zarobek. Nic więcej.
4. **Nowe zlecenie** (pełny ekran, dźwięk + wibracja, 30 s na decyzję) — odległość do klienta, typ zdarzenia i auta, trasa, **kwota**, dwa przyciski na pół ekranu: **„BIORĘ”** / „Nie”.
5. **W trakcie** — jeden przycisk zmieniający etapy: „Jadę” → „Jestem na miejscu” → „Auto załadowane” → „Zakończ”. Do tego „Nawiguj” (otwiera Google Maps/Waze) i „Zadzwoń do klienta”.
6. **Historia / zarobki** — lista zleceń, suma tygodnia.

## 3. Zasady UX

**Dla klienta w stresie**
- Jeden główny CTA na ekran, pomarańczowy, pełna szerokość, wysokość min. **56 px** (lepiej 64).
- Kontrast tekstu min. WCAG AA (4.5:1), tekst bazowy 18 px.
- Tryb ciemny w nocy (mniej oślepia na poboczu, oszczędza baterię).
- Zero formularzy przed pokazaniem ceny. Telefon podajemy dopiero przy zamówieniu.
- Cena zawsze jako kwota całkowita („280 zł”), nie „od 150 zł”.
- „Zadzwoń” zawsze widoczny: na starcie do dyspozytora, potem do kierowcy.
- Bezpieczeństwo: na ekranie śledzenia podpowiedź „Włącz światła awaryjne, ustaw trójkąt, stań za barierką”.
- Odporność na słaby zasięg: lekka strona, statusy dochodzą też SMS-em.

**Dla lawециarza (rękawice, kabina, słońce)**
- Przyciski min. **72 px**, odstęp ≥16 px, akcje na dole ekranu (zasięg kciuka).
- Bez gestów precyzyjnych (swipe, long-press); tylko tap.
- Głośny, wyróżniający dźwięk nowego zlecenia, działa przy wygaszonym ekranie.
- Tryb głosowy (v2): odczyt zlecenia TTS („Nowe zlecenie, 8 km, osobówka, 260 zł”) i komenda „Biorę”. W MVP tylko odczyt TTS.
- Ekran nie gaśnie w trakcie zlecenia (wake lock).

## 4. Mikrocopy

**Ekrany i przyciski (klient)**
- Start, nagłówek: **„Gdzie jesteś?”**; pod spodem: „Ustaliliśmy Twoją lokalizację. Popraw pinezkę, jeśli trzeba.”
- CTA: **„Potrzebuję lawety”** · „Zmień miejsce” · „Zadzwoń do nas”
- Ekran 2: **„Co się stało?”** · kafle: „Nie odpala”, „Wypadek”, „Koło / opona”, „Inne” · „Jakie auto?”
- Ekran 3: **„Lawety w pobliżu”** · etykieta „Najszybsza” · CTA **„Zamów · {cena} zł”** · podpis „Cena całkowita. Bez niespodzianek.”
- Ekran 4: **„Podaj numer telefonu”** · „Kierowca zadzwoni, gdy będzie blisko. Bez zakładania konta.” · CTA **„Potwierdź”**
- Ocena: **„Jak poszło?”** · „Dziękujemy. Szerokiej drogi!”

**Stany puste / błędy**
- Brak lawet: **„Szukamy dalej… Na razie nikt nie jest wolny w pobliżu.”** + CTA **„Zadzwoń do dyspozytora”** + „Powiadomimy Cię SMS-em, gdy ktoś się zwolni.”
- Brak GPS: **„Nie widzimy Twojej lokalizacji.”** · „Włącz lokalizację albo wpisz adres / numer kilometra.”
- Brak sieci: „Słaby zasięg. Twoje zamówienie jest bezpieczne, wyślemy statusy SMS-em.”
- Odrzucone zlecenie: „Ta laweta nie może przyjechać. Szukamy kolejnej…”

**Statusy zlecenia (klient)**
| Kod | Tekst |
|---|---|
| `searching` | **Szukamy lawety…** |
| `pending_accept` | **Czekamy na potwierdzenie kierowcy…** |
| `accepted` | **Laweta przyjęła zlecenie · {firma}** |
| `en_route` | **Laweta jedzie do Ciebie · {eta} min** |
| `arriving` | **Laweta jest blisko · ok. 2 min** |
| `arrived` | **Laweta na miejscu** |
| `loading` | **Ładujemy Twoje auto** |
| `in_transit` | **W drodze do celu · {eta} min** |
| `completed` | **Gotowe. Do zapłaty: {cena} zł** |
| `cancelled` | **Zlecenie anulowane** |
| `no_match` | **Nie znaleźliśmy wolnej lawety** |

**Lawециarz**
- Przełącznik: **„JESTEM DOSTĘPNY”** / **„NIEDOSTĘPNY”**
- Nowe zlecenie: **„Nowe zlecenie · {km} km od Ciebie”** · **„BIORĘ”** / **„Nie”** · licznik „{s} s”
- Etapy: „Jadę” → „Jestem na miejscu” → „Auto załadowane” → „Zakończ”
- Pusty stan: „Jesteś dostępny. Damy znać, gdy pojawi się zlecenie.”

## 5. Pozyskanie dwóch stron rynku

**Miasto startowe: Poznań.** Węzeł A2/S5/S11, duże natężenie ruchu tranzytowego, ok. 1 mln mieszkańców w aglomeracji, a ruch lawet jest tam rozdrobniony. Ten rynek da się obsłużyć zespołem kilku osób, a konkurencja w Ads jest mniejsza niż w Warszawie. Plan B: Łódź (skrzyżowanie A1/A2).

**Podaż — pierwszych 50 lawециarzy (najpierw podaż, dopiero potem ruch):**
1. **Lista ręczna**: Google Maps „pomoc drogowa / laweta Poznań” i okolice w promieniu 40 km, OLX/Allegro Lokalnie (ogłoszenia lawet), Panorama Firm, oponeo/autoholowanie, katalogi. Cel: arkusz z ~200 kontaktami.
2. **Telefony, nie maile**: skrypt rozmowy na 60 s: „Płacisz za Google Ads? My dajemy Ci zlecenia z Twojej okolicy, przez pierwsze 6 miesięcy bez prowizji. Ustawiasz swoje ceny.”
3. **Grupy FB lawециarzy i pomocy drogowej** (np. ogólnopolskie grupy „Lawety / Pomoc drogowa”, giełdy zleceń): posty z wynikami, nie reklamy.
4. **Onboarding na miejscu**: osobiście instalujemy apkę i ustawiamy stawki (15 min przy kawie na bazie). Starszy użytkownik nie przejdzie samodzielnie przez 6 kroków.
5. **Gwarancja**: „Founding partner”: 0% prowizji do końca 2027, odznaka na profilu, wyższa pozycja na liście przy równym ETA.
6. **Polecenia**: lawециarz poleca kolegę i dostaje kolejne 3 miesiące bez prowizji.
7. Na start ręczna dyspozytornia (człowiek przy telefonie), który przekazuje zlecenia, gdy nikt nie jest online, więc żadne zgłoszenie nie przepada.

**Popyt — klienci:**
- **SEO lokalne jedną domeną**: `holuj.pl/laweta/poznan`, `/laweta/a2-poznan-konin`, `/pomoc-drogowa/swarzedz`… Jedna silna domena zamiast 100 stron lawециarzy, które się nawzajem przebijają. Strony z realną liczbą lawet online, cennikiem przykładowym i opiniami. Schema `LocalBusiness`/`Service`, Google Business Profile dla marki.
- **Google Ads na start tylko na frazy „laweta teraz / pomoc drogowa [miasto]”** — jeden budżet za wszystkich, CPC dzielony na całą sieć.
- **Partnerstwa B2B**: warsztaty i serwisy opon (naklejka z QR „Potrzebujesz lawety?” + prowizja za polecenie), stacje paliw na A2/S5, parkingi i MOP-y, wypożyczalnie aut i floty (abonament, faktura zbiorcza), komisy i dealerzy, ubezpieczyciele/assistance (v2).
- **Naklejki QR** na lawetach partnerów („Następnym razem zamów w Holuj”), bo zadowolony klient wraca.
- Brak lawety w promieniu = łapiemy kontakt i dzwonimy ręcznie; pierwsze 100 zgłoszeń traktujemy jak concierge.

## 6. KPI MVP

| KPI | Cel na 3 mies. |
|---|---|
| Czas od otwarcia do złożenia zamówienia | mediana < 60 s |
| Czas do dopasowania (zamówienie → akceptacja) | mediana < 2 min |
| % zgłoszeń z dopasowaniem (fill rate) | > 80% (noc > 60%) |
| ETA rzeczywiste vs obiecane | odchylenie < 20% |
| Lawety online w szczycie (7–9, 15–19) / w nocy | ≥ 15 / ≥ 5 w Poznaniu |
| Wskaźnik akceptacji zleceń przez lawециarzy | > 70% |
| Anulacje klienta po akceptacji | < 10% |
| Aktywni lawециarze (≥1 zlecenie/tydz.) | 30 z 50 |
| Zlecenia na lawециarza / tydzień | ≥ 3 |
| Konwersja: wejście na stronę → zamówienie | > 8% |
| Ocena średnia | ≥ 4,6 |
| Koszt pozyskania zlecenia vs Ads lawециarza | ≥ 50% taniej |

## 7. Landing page

**Dla klientów (`/`)**
1. **Hero:** „Laweta w minutę. Cena z góry.” · sub: „Najbliższa pomoc drogowa w Poznaniu — zobacz cenę i czas dojazdu, zanim zamówisz.” · CTA **„Zamów lawetę teraz”** + „Zadzwoń: 61 …”
2. **Licznik na żywo:** „{n} lawet dostępnych teraz w okolicy”.
3. **Jak to działa (3 kroki):** „Pokaż, gdzie jesteś” → „Wybierz lawetę z ceną” → „Śledź dojazd na mapie”.
4. **Dlaczego Holuj:** „Cena całkowita bez niespodzianek” · „Najbliższa laweta, nie najdroższa reklama” · „24/7, także w nocy i w weekendy” · „Bez rejestracji — wystarczy numer”.
5. **Co robić po awarii/wypadku** (checklista bezpieczeństwa, dobra pod SEO).
6. **Opinie + liczby** („Średni dojazd: 24 min”).
7. **Obsługiwane miejsca** — linki do podstron miast/tras (SEO).
8. **FAQ** (ile kosztuje laweta, płatność, holowanie do warsztatu, auta dostawcze).
9. **Stopka CTA:** „Stoisz na poboczu? Zamów lawetę teraz.”

**Dla lawециarzy (`/dla-lawet`)**
1. **Hero:** „Zlecenia z Twojej okolicy. Bez płacenia za Google Ads.” · CTA **„Dołącz za darmo”** + „Zadzwoń, pomożemy założyć konto”.
2. **Problem:** „Płacisz kilkanaście złotych za kliknięcie i walczysz z sąsiadem o pierwsze miejsce w Google?”
3. **Jak działa:** „Włączasz »Jestem dostępny«” → „Dostajesz zlecenie z ceną” → „Bierzesz albo nie — Ty decydujesz”.
4. **Twoje zasady:** „Sam ustawiasz stawki” · „Bez grafiku i minimalnej liczby zleceń” · „Klient płaci Tobie”.
5. **Oferta startowa:** „0% prowizji dla pierwszych 50 firm w Poznaniu do końca 2027.”
6. **Proste jak telefon:** zrzuty ekranu z wielkimi przyciskami — „Obsłużysz w rękawicach”.
7. **Opinie partnerów + FAQ** (prowizja, faktury, co jeśli nie mogę jechać).
8. **Formularz:** imię, telefon, miasto → „Oddzwonimy w 24 h”.
