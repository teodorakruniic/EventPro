# EventPro

EventPro je spletna aplikacija za organizacijo konferenc, seminarjev in delavnic. Organizatorjem omogoča upravljanje konferenc, predavateljem oddajo predlogov predavanj, udeležencem pa prijavo na konference, rezervacijo sedežev in upravljanje osebnega urnika.

Projekt je razvit v okviru študijskih nalog in vključuje implementacijo MVP funkcionalnosti.

## Tehnološki sklad

- **Frontend:** React, Vite, TypeScript, CSS
- **Backend:** Node.js, Express, TypeScript, REST API
- **Podatkovna baza:** PostgreSQL
- **ORM:** Prisma
- **Avtentikacija:** JWT
- **Uporabniške vloge:** ORGANIZER, SPEAKER, ATTENDEE
- **Razvoj:** Git, GitHub Flow, GitHub Projects, Pull Requests
- **Lokalno okolje:** Docker Desktop, npm

## Implementirane funkcionalnosti MVP

### US-01 – Upravljanje dogodkov
Organizator lahko ustvari, ureja, objavi in upravlja svoje konference. Določi naslov, opis, lokacijo, termin in kapaciteto.

### US-02 – Oddaja in potrjevanje predlogov
Predavatelj lahko odda predlog predavanja. Organizator lahko predlog pregleda, sprejme ali zavrne.

### US-03 – Priprava programa
Organizator lahko sprejeta predavanja razporedi v prostore in časovne termine. Sistem preverja časovne konflikte.

### US-04 – Prijava na dogodek
Udeleženec se lahko prijavi na objavljeno konferenco. Sistem preverja kapaciteto in preprečuje podvojene prijave.

### US-05 – Rezervacije in osebni urnik
Udeleženec lahko rezervira sedež na predavanju, upravlja rezervacije in pregleduje osebni urnik.

### US-06 – Samodejni čakalni seznam
Ob zapolnjeni kapaciteti se lahko udeleženec pridruži čakalnemu seznamu. Ob sprostitvi mesta sistem poskuša samodejno dodeliti rezervacijo naslednjemu upravičenemu udeležencu.

### US-07 – Spremljanje zasedenosti
Organizator lahko spremlja število prijavljenih udeležencev, razpoložljiva mesta, zasedenost predavanj in čakalne sezname.

## Dodatne funkcionalnosti

- Registracija in prijava uporabnikov
- Upravljanje uporabniškega profila in profilne slike
- Upravljanje naslovnih slik konferenc
- Rezervacija in sprememba sedeža
- QR-vstopnice za rezervacije
- Preverjanje QR-vstopnic (check-in)
- Pregled programa konference
- Arhiviranje in podvajanje konferenc

## Struktura projekta

```text
EventPro/
├── frontend/          # React, Vite, TypeScript
├── backend/           # Node.js, Express, Prisma
├── docs/              # Projektna dokumentacija
└── README.md
```

## Lokalni zagon aplikacije

### Zahteve

Za lokalni zagon potrebujemo:

- Node.js in npm
- Docker Desktop
- Git
- PostgreSQL podatkovno bazo
- Konfigurirane okoljske spremenljivke

### 1. Kloniranje repozitorija

```bash
git clone https://github.com/teodorakruniic/EventPro.git
cd EventPro
```

### 2. Zagon podatkovne baze

Zaženemo Docker Desktop in PostgreSQL podatkovno bazo, ki jo uporablja aplikacija.

Povezava do podatkovne baze mora biti pravilno nastavljena v datoteki `backend/.env`.

### 3. Konfiguracija backend okolja

V mapi `backend` pripravimo datoteko `.env` z ustreznimi nastavitvami.

Primer potrebnih spremenljivk:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
JWT_SECRET="replace-with-a-secure-secret"
PORT=3001
```

Vrednosti prilagodimo lokalnemu okolju. Datoteke `.env` ne dodajamo v Git repozitorij.

### 4. Zagon backend aplikacije

Odpremo terminal v korenski mapi projekta:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Backend je dostopen na:

http://localhost:3001

Preverjanje API-ja:

http://localhost:3001/api/health

Preverjanje povezave s podatkovno bazo:

http://localhost:3001/api/health/db

### 5. Zagon frontend aplikacije

Odpremo nov terminal v korenski mapi projekta:

```bash
cd frontend
npm install
npm run dev
```

Frontend je dostopen na:

http://localhost:5173

### 6. Uporaba aplikacije

Po zagonu odpremo aplikacijo v brskalniku.

Uporabnik lahko ustvari račun in se prijavi z eno izmed podprtih vlog:

- **ORGANIZER:** upravljanje konferenc, predavanj, programa, statistike in preverjanje vstopnic.
- **SPEAKER:** oddaja in pregled predlogov predavanj.
- **ATTENDEE:** prijava na konference, rezervacija sedežev, čakalni seznam in osebni urnik.

## Razvojni proces

Pri razvoju uporabljamo GitHub Flow.

Za posamezno funkcionalnost ustvarimo ločeno razvojno vejo. Spremembe dokumentiramo s smiselnimi commit sporočili in jih združujemo v glavno vejo `main` prek Pull Requestov.

Razvojne naloge spremljamo v GitHub Projects s Kanban stolpci:

- To Do
- Doing
- Done

GitHub Issues vsebujejo opise nalog, povezave z uporabniškimi zgodbami in pogoje sprejemljivosti.

## Dokumentacija

- [Zasnova rešitve](docs/01-zasnova-resitve.md)
- [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
- [Podatkovni model](docs/03-podatkovni-model.md)
- [Arhitektura in tehnologije](docs/04-arhitektura-in-tehnoloski-sklad.md)
- [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
- [Wireframe-i](docs/06-wireframes.md)
- [Arhitekturne odločitve](docs/adr/)

## Trenutno stanje projekta

Sedem načrtovanih MVP funkcionalnosti je implementiranih.

Projekt vsebuje delujoč frontend, backend, podatkovno bazo, avtentikacijo in osnovne funkcionalnosti upravljanja konferenc.

Pred končno oddajo je treba preveriti pogoje sprejemljivosti, predvsem samodejno dodeljevanje mest s čakalnega seznama.