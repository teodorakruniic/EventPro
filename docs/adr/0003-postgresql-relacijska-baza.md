# 0003 – PostgreSQL za relacijske podatke

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Dogodki, predavanja, prijave in rezervacije imajo povezave, enolične omejitve in zahteve po atomarnih spremembah.

## Obravnavane alternative

- **Izbrana možnost:** PostgreSQL.
- **Druge možnosti:** MongoDB (prilagodljiva shema, vendar več previdnosti pri relacijah in transakcijah); SQLite (enostaven lokalni razvoj, manj primeren za predvideno večuporabniško delovanje).

## Odločitev in utemeljitev

Izberemo **PostgreSQL**. PostgreSQL podpira tuje ključe, transakcije in omejitve, ki pomagajo preprečevati nekonsistentne rezervacije.

## Posledice

- **Pozitivne:** Zanesljiva integriteta podatkov in podpora sočasnim zahtevam.
- **Negativne:** Potrebujemo lokalni podatkovni strežnik in načrtovanje migracij.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
