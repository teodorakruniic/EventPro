# 0002 – Node.js in Express REST API

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Potrebujemo ločeno poslovno logiko za potrjevanje predavanj, preverjanje pravic in rezervacije; v prihodnosti je mogoč še mobilni odjemalec.

## Obravnavane alternative

- **Izbrana možnost:** Node.js + Express + TypeScript, REST/JSON.
- **Druge možnosti:** NestJS (več vgrajene strukture, a več začetne kompleksnosti); monolitni strežniško izrisani spletni vmesnik (manj ločitve med odjemalcem in strežnikom).

## Odločitev in utemeljitev

Izberemo **Node.js + Express + TypeScript, REST/JSON**. Express je dovolj prilagodljiv za obseg projekta in omogoča jasno razmejitev API poti, storitev ter podatkovnega dostopa.

## Posledice

- **Pozitivne:** Jasna ločitev odjemalca in strežnika ter ponovna uporaba API-ja.
- **Negativne:** Arhitekturne konvencije, validacijo in obravnavo napak moramo dosledno urediti sami.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
