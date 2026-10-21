# 0007 – Docker Compose za lokalno podatkovno bazo

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Razvijalci uporabljajo različne računalnike; ročna namestitev in konfiguracija PostgreSQL lahko povzročita razlike med okolji.

## Obravnavane alternative

- **Izbrana možnost:** Docker Compose za lokalni PostgreSQL.
- **Druge možnosti:** Ročna namestitev PostgreSQL (manj odvisnosti, več nastavitev); oddaljena skupna razvojna baza (manj lokalne nastavitve, odvisnost od omrežja).

## Odločitev in utemeljitev

Izberemo **Docker Compose za lokalni PostgreSQL**. Docker Compose omogoča ponovljivo lokalno okolje z enako različico podatkovne baze.

## Posledice

- **Pozitivne:** Lažje uvajanje novih razvijalcev in manj razlik med okolji.
- **Negativne:** Zahteva Docker in dodatne sistemske vire.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
