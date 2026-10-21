# 0001 – React in TypeScript za uporabniški vmesnik

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Potrebujemo odziven spletni vmesnik za tri uporabniške vloge, obrazce, urnike in pregled rezervacij.

## Obravnavane alternative

- **Izbrana možnost:** React + Vite + TypeScript.
- **Druge možnosti:** Vue + TypeScript (primerna alternativa, vendar drugačen ekosistem); klasični HTML in JavaScript (manj orodij, vendar zahtevnejše vzdrževanje več interaktivnih zaslonov).

## Odločitev in utemeljitev

Izberemo **React + Vite + TypeScript**. React omogoča ponovno uporabo komponent, TypeScript pa zgodnje preverjanje tipov. Vite poenostavi razvojni zagon.

## Posledice

- **Pozitivne:** Ponovna uporaba komponent in predvidljiv vzdrževalni odtis pri rasti števila zaslonov.
- **Negativne:** Potreba po začetni nastavitvi orodij in učenju komponentnega pristopa.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
