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


