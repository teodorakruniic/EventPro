# 0009 – GitHub Flow in avtomatska preverjanja

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Spremembe dokumentacije in prihodnje kode želimo pregledno združevati, preprečiti nenamerne neposredne spremembe main ter zgodaj odkriti napake.

## Obravnavane alternative

- **Izbrana možnost:** GitHub Flow z zaščiteno vejo main; GitHub Actions ob uvedbi kode.
- **Druge možnosti:** Neposredno delo na main (hitreje, a večje tveganje); Git Flow z razvojnimi in izdajskimi vejami (več postopkov za manjši projekt).

## Odločitev in utemeljitev

Izberemo **GitHub Flow z zaščiteno vejo main; GitHub Actions ob uvedbi kode**. Kratkotrajne veje in pull requesti zadostujejo za obseg projekta; preverjanja gradnje in testov bomo dodali, ko bo aplikacija implementirana.

## Posledice

- **Pozitivne:** Jasna zgodovina sprememb in možnost avtomatskega preverjanja kakovosti.
- **Negativne:** Vsaka sprememba zahteva pull request; zaščito veje je treba nastaviti v GitHub Settings.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
