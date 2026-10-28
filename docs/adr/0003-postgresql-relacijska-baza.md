# 0003 – PostgreSQL za relacijske podatke

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

EventPro upravlja dogodke, predavanja, prostore, prijave udeležencev in rezervacije predavanj. Podatki so med seboj povezani: predavanje pripada dogodku, rezervacija pa določenemu predavanju in udeležencu.

Sistem mora preprečiti podvojene prijave, rezervacije nad dovoljeno kapaciteto in izgubo podatkov ob sočasnih zahtevah. Posebej pomemben je čakalni seznam: ko se rezervacija odpove, mora sistem sproščeno mesto pravilno dodeliti naslednjemu ustreznemu udeležencu.

Zato potrebujemo podatkovno bazo, ki podpira relacije, omejitve in zanesljive transakcije.

## Obravnavane alternative

- **PostgreSQL:** Relacijska podatkovna baza s tujimi ključi, enoličnimi omejitvami in transakcijami. Primerna je za povezane podatke ter sočasne rezervacije.
- **MongoDB:** Dokumentna podatkovna baza s prilagodljivo shemo. Primerna je za manj strukturirane podatke, vendar bi morali pri našem podatkovnem modelu bolj skrbno načrtovati povezave med dokumenti.
- **SQLite:** Preprosta relacijska baza brez ločenega strežnika. Primerna je za prototipe, vendar je za predvideno spletno aplikacijo z več sočasnimi uporabniki PostgreSQL ustreznejša izbira.

## Odločitev in utemeljitev

Za EventPro izberemo **PostgreSQL**.

Podatke bomo organizirali v povezane tabele, kot so `User`, `Conference`, `Room`, `Talk`, `ConferenceRegistration` in `TalkReservation`. S tujimi ključi bomo ohranili povezave med zapisi, z enoličnimi omejitvami pa preprečili več prijav istega udeleženca na isti dogodek oziroma več rezervacij za isto predavanje.

Pri rezervacijah in samodejnem dodeljevanju mest s čakalnega seznama bomo uporabili transakcije. Tako bomo lahko preverjanje prostega mesta in spremembo rezervacije izvedli kot celoto. Za preprečevanje prevelikega števila potrjenih rezervacij bomo poleg transakcij uporabili tudi ustrezno zaklepanje oziroma nadzor sočasnih sprememb v zalednem sistemu.

PostgreSQL je zato primeren za podatkovni model in pravila, ki jih zahteva EventPro.

## Posledice

**Pozitivne:**
- Jasne povezave med uporabniki, dogodki, predavanji in rezervacijami.
- Tuji ključi in enolične omejitve pomagajo ohranjati pravilnost podatkov.
- Transakcije omogočajo varnejše obravnavanje sočasnih rezervacij in čakalnega seznama.
- Podatkovni model je mogoče postopoma razširjati z novimi tabelami, na primer za ocene in obvestila.

**Negativne:**
- Za lokalni razvoj moramo zagnati in nastaviti podatkovni strežnik.
- Spremembe strukture tabel zahtevajo načrtovane migracije.
- Sočasno rezerviranje zahteva dodatno logiko in pravilno uporabo transakcij; sama izbira baze ne prepreči vseh napak.

## Povezave

- [Podatkovni model](../03-podatkovni-model.md)
- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
