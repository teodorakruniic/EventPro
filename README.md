# EventPro

**EventPro** je načrtovana spletna aplikacija za organizacijo konferenc, seminarjev in delavnic. Organizatorji pripravljajo dogodke in programe, predavatelji oddajajo predloge, udeleženci pa se prijavljajo, rezervirajo predavanja in uporabljajo čakalne sezname.

## Načrtovane tehnologije

- **Frontend:** React, Vite, TypeScript, CSS
- **Backend:** Node.js, Express, TypeScript, REST API
- **Podatkovna baza:** PostgreSQL; **ORM:** Prisma
- **Prijava:** strežniške seje, varni piškotki, Argon2id
- **Validacija in testi:** Zod, Vitest, Supertest
- **Razvoj:** GitHub Flow, GitHub Actions (načrtovano), Docker Compose (načrtovano)
- **Kasnejša integracija:** Google Calendar API in OAuth 2.0

Projekt je trenutno v fazi priprave dokumentacije. Mapi `frontend/` in `backend/` sta namenjeni prihodnji implementaciji; aplikacija še ni pripravljena za zagon.

## Dokumentacija

- [Zasnova rešitve](docs/01-zasnova-resitve.md)
- [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
- [Podatkovni model](docs/03-podatkovni-model.md)
- [Arhitektura in tehnologije](docs/04-arhitektura-in-tehnoloski-sklad.md)
- [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
- [Wireframe-i](docs/06-wireframes.md)
- [Arhitekturne odločitve (ADR)](docs/adr/)

## Razvojni proces

Uporabljamo **GitHub Flow**: za spremembo ustvarimo novo vejo iz `main`, pripravimo commit, odpremo pull request in po preverjanju združimo spremembe v `main`. Neposredne spremembe in prisilno prepisovanje veje `main` niso dovoljeni. Projekt uporablja GitHub Flow. Spremembe razvijamo v ločenih vejah in jih v glavno vejo `main` združujemo prek pull requestov.



## Lokalni zagon aplikacije

### Zahteve
- Node.js (različica 22.12.0 ali novejša)
- npm
- Git

### 1. Kloniranje repozitorija

```bash
git clone https://github.com/teodorakruniic/EventPro.git
cd EventPro
```

### 2. Zagon zalednega dela (backend)

Odprite terminal in izvedite:

```bash
cd backend
npm install
npm run dev
```

Zaledni strežnik se zažene na naslovu:

http://localhost:3001

Preverjanje delovanja API-ja:

http://localhost:3001/api/health

### 3. Zagon uporabniškega vmesnika (frontend)

Odprite nov terminal v korenski mapi projekta:

```bash
cd frontend
npm install
npm run dev
```

Uporabniški vmesnik je dostopen na naslovu:

http://localhost:5173

### 4. Preverjanje povezave

Ob odprtju aplikacije se mora prikazati sporočilo:

`EventPro API is running`

To pomeni, da frontend uspešno komunicira z backendom.

### Trenutno stanje razvoja

- React + Vite + TypeScript frontend je vzpostavljen.
- Node.js + Express + TypeScript backend je vzpostavljen.
- Osnovni REST API endpoint `/api/health` deluje.
- Povezava med frontend in backend aplikacijo je preverjena.

Podatkovna baza PostgreSQL in funkcionalnosti MVP bodo implementirane v naslednjih razvojnih korakih.


