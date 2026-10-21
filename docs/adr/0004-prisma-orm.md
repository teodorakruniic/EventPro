# 0004 – Prisma za podatkovni dostop in migracije

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Backend mora varno in pregledno uporabljati relacijski model ter omogočiti ponovljive spremembe sheme.

## Obravnavane alternative

- **Izbrana možnost:** Prisma ORM.
- **Druge možnosti:** Ročno pisanje SQL poizvedb (več nadzora, več ponavljajoče se kode); TypeORM (podobne možnosti, drugačen model shem in migracij).

## Odločitev in utemeljitev

Izberemo **Prisma ORM**. Prisma omogoča tipiziran dostop do podatkov in verzionirane migracije, ki ustrezajo TypeScript skladu.

## Posledice

- **Pozitivne:** Manj rutinske kode in lažje usklajevanje sheme med člani ekipe.
- **Negativne:** Dodatna odvisnost; za zahtevnejše poizvedbe bo morda potreben surov SQL.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
