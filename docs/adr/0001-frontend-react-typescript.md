# 0001 – React in TypeScript za uporabniški vmesnik

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Aplikacija EventPro bo imela tri uporabniške vloge: organizatorja, predavatelja in udeleženca. Vsaka vloga potrebuje različne zaslone in funkcionalnosti.

Organizator bo upravljal dogodke in pripravljal program, predavatelj bo oddajal predloge predavanj, udeleženec pa bo rezerviral predavanja in spremljal svoj urnik.

Zato potrebujemo tehnologijo, ki omogoča razvoj interaktivnega spletnega vmesnika, ponovno uporabo komponent in enostavno povezavo z zalednim sistemom.

## Obravnavane alternative

- **React + Vite + TypeScript:** Omogoča razvoj uporabniškega vmesnika s komponentami, preverjanje tipov in hitro razvojno okolje.
- **Vue + TypeScript:** Prav tako omogoča komponentni razvoj in bi bil primerna alternativa, vendar imamo več izkušenj z Reactom.
- **HTML, CSS in JavaScript:** Primerna izbira za preproste spletne strani, vendar bi bilo pri večjem številu interaktivnih zaslonov težje organizirati in vzdrževati kodo.

## Odločitev in utemeljitev

Za razvoj uporabniškega vmesnika izberemo **React, Vite in TypeScript**.

React omogoča, da skupne elemente, kot so navigacija, obrazci, kartice dogodkov in prikaz urnika, razvijemo kot komponente in jih uporabimo na več mestih.

TypeScript pomaga pri preverjanju podatkovnih tipov in zmanjšuje možnost napak pri delu s podatki o dogodkih, predavanjih in rezervacijah.

Vite omogoča hiter zagon razvojnega okolja in preprosto pripravo aplikacije za uporabo.

Ta kombinacija je primerna za EventPro, ker bo aplikacija vsebovala več povezanih zaslonov in se bo postopoma širila z novimi funkcionalnostmi.

## Posledice

**Pozitivne:**
- Skupne komponente lahko uporabimo na različnih zaslonih.
- Koda je lažje organizirana in preglednejša.
- TypeScript omogoča zgodnejše odkrivanje nekaterih napak.
- Dodajanje novih funkcionalnosti je enostavnejše zaradi komponentne strukture.

**Negativne:**
- Potrebna je začetna nastavitev razvojnega okolja.
- Razvoj zahteva poznavanje Reacta in TypeScripta.
- Pri večjem številu komponent moramo skrbeti za dobro organizacijo projekta.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
