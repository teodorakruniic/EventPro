# 0002 – Node.js in Express za REST API

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Aplikacija EventPro potrebuje zaledni sistem, ki bo obdeloval zahteve treh uporabniških vlog: organizatorja, predavatelja in udeleženca. Zaledni sistem mora preverjati uporabniške pravice, omogočati oddajo in potrjevanje predlogov predavanj ter skrbeti za prijave in rezervacije.

Pri rezervacijah mora preveriti razpoložljiva mesta in časovne konflikte. Če je predavanje polno, mora podpirati čakalni seznam in ob sprostitvi mesta preveriti, kdo je naslednji upravičenec. Ta pravila morajo veljati ne glede na to, s katerega zaslona uporabnik pošlje zahtevo.

Želimo tudi jasno ločiti uporabniški vmesnik od poslovne logike, da bi lahko isti API v prihodnosti uporabljala mobilna aplikacija.

## Obravnavane alternative

- **Node.js + Express + TypeScript in REST/JSON:** Omogoča razvoj API-ja z razmeroma malo začetne konfiguracije. TypeScript lahko uporabljamo tako na sprednjem kot na zalednem delu aplikacije.
- **NestJS + TypeScript:** Ponuja vnaprej določeno strukturo projekta in številne vgrajene možnosti, vendar za trenutno velikost EventPro pomeni več začetnega učenja in nastavitev.
- **Strežniško izrisana aplikacija:** Uporabniški vmesnik in zaledni del bi bila tesneje povezana. Za začetni razvoj bi to lahko bilo preprostejše, vendar bi bilo težje uporabiti iste funkcionalnosti v prihodnjem mobilnem odjemalcu.

## Odločitev in utemeljitev

Za zaledni del izberemo **Node.js, Express in TypeScript**, komunikacija s sprednjim delom pa bo potekala prek **REST API-ja z uporabo JSON**.

Express omogoča, da API organiziramo v poti, krmilnike in storitve. Tako lahko ločimo sprejem zahtev od pravil za potrjevanje predavanj, rezervacije in čakalni seznam. TypeScript pomaga pri delu s podatki in omogoča doslednejše podatkovne strukture med sprednjim in zalednim delom.

REST API je primeren, ker Reactov uporabniški vmesnik potrebuje jasne operacije za pridobivanje, ustvarjanje in spreminjanje podatkov. Zaledni del bo preverjal pravice uporabnikov in veljavnost podatkov, za spremembe rezervacij in čakalnega seznama pa bomo uporabili podatkovne transakcije, da preprečimo dvojne rezervacije istega mesta.

Izbrana rešitev je dovolj preprosta za razvoj študentskega projekta, hkrati pa omogoča kasnejšo razširitev aplikacije.

## Posledice

**Pozitivne:**
- Uporabniški vmesnik in poslovna logika sta ločena.
- Isti REST API lahko v prihodnosti uporablja tudi mobilna aplikacija.
- TypeScript uporabljamo na obeh delih projekta, zato je delo s podatki bolj dosledno.
- Pravila za rezervacije, kapacitete in čakalni seznam so zbrana na zalednem delu in jih lahko ločeno testiramo.

**Negativne:**
- Strukturo map, validacijo podatkov in obravnavo napak moramo urediti sami.
- Potrebujemo dodatno konfiguracijo za komunikacijo med sprednjim in zalednim delom.
- Pri sočasnih rezervacijah moramo posebej poskrbeti za transakcije in pravilno obravnavo konfliktov.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
