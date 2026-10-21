# 0005 – Strežniške seje in nadzor dostopa

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Uporabniki imajo tri vloge, občutljive operacije pa zahtevajo preverjanje lastništva dogodka ali rezervacije.

## Obravnavane alternative

- **Izbrana možnost:** Strežniške seje s piškotki HttpOnly, Secure v produkciji, SameSite=Lax; Argon2id za gesla.
- **Druge možnosti:** JWT v localStorage (enostaven prenos žetona, večja izpostavljenost ob XSS); zunanja prijavna storitev (hitrejši začetek, odvisnost od ponudnika).

## Odločitev in utemeljitev

Izberemo **Strežniške seje s piškotki HttpOnly, Secure v produkciji, SameSite=Lax; Argon2id za gesla**. Seje omogočajo preklic prijave na strežniku, piškotki HttpOnly pa niso dostopni JavaScriptu. Vsako operacijo še vedno avtorizira backend.

## Posledice

- **Pozitivne:** Centralen nadzor sej in pravic; gesla niso shranjena v čitljivi obliki.
- **Negativne:** Potrebujemo shrambo sej, zaščito pred CSRF ter pravilno konfiguracijo piškotkov in HTTPS.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
