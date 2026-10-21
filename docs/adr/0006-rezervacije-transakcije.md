# 0006 – Transakcije za rezervacije in čakalni seznam

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Več udeležencev lahko hkrati rezervira zadnje mesto; ob odpovedi mora sistem varno dodeliti mesto čakajočemu uporabniku.

## Obravnavane alternative

- **Izbrana možnost:** Transakcije PostgreSQL z ustreznim zaklepanjem in preverjanjem omejitev.
- **Druge možnosti:** Ločene poizvedbe brez transakcije (preprostejše, a nevarnost dvojne rezervacije); obdelava samo v pomnilniku aplikacije (ne deluje z več strežniki).

## Odločitev in utemeljitev

Izberemo **Transakcije PostgreSQL z ustreznim zaklepanjem in preverjanjem omejitev**. Potrditev rezervacije in posodobitev čakalnega seznama morata biti atomarni, da kapaciteta ni presežena.

## Posledice

- **Pozitivne:** Dosledna zasedenost in pravična obravnava čakalnega seznama.
- **Negativne:** Večja kompleksnost, potreba po testih sočasnosti in pravilnem obravnavanju zaklepanja.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
