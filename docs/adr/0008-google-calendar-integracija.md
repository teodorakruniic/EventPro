# 0008 – Google Calendar API kot ločena kasnejša integracija

- **Status:** Sprejeto
- **Datum:** 2026-10-21

## Kontekst in problem

Uporabniki želijo samodejno dodajanje, spreminjanje in odstranjevanje rezerviranih terminov v osebnem koledarju, vendar to ni del MVP.

## Obravnavane alternative

- **Izbrana možnost:** Google Calendar API z OAuth 2.0 po izrecni povezavi računa.
- **Druge možnosti:** Prenos datoteke ICS (brez prijave, vendar brez samodejne dvosmerne posodobitve); ročni vnos terminov (brez razvoja, slabša izkušnja).

## Odločitev in utemeljitev

Izberemo **Google Calendar API z OAuth 2.0 po izrecni povezavi računa**. Google Calendar API podpira posodabljanje dogodkov, OAuth 2.0 pa omogoča omejen dostop s privolitvijo uporabnika. Integracija ostane neobvezna in ločena od osnovnih rezervacij.

## Posledice

- **Pozitivne:** Samodejna sinhronizacija in bolj uporaben osebni urnik.
- **Negativne:** Zunanja odvisnost, upravljanje dovoljenj in žetonov ter obravnava neuspešne sinhronizacije.

## Povezave

- [Arhitektura in tehnološki sklad](../04-arhitektura-in-tehnoloski-sklad.md)
