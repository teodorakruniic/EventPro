# EventPro – funkcionalnosti in obseg

## Uporabniške vloge in pravice

Aplikacija EventPro ima tri uporabniške vloge: organizator, predavatelj in udeleženec. Vsaka vloga ima svoje naloge in pravice.

| Vloga | Kaj lahko počne? | Česa ne more početi? |
|---|---|---|
| **Organizator** | Ustvarja in ureja svoje dogodke, potrjuje predavanja, pripravlja program, določa termine in prostore, spremlja prijave ter analizira uspešnost dogodkov. | Ne more urejati dogodkov drugih organizatorjev, spreminjati osebnih podatkov drugih uporabnikov ali oddajati predlogov v imenu predavateljev. |
| **Predavatelj** | Oddaja predloge predavanj, ureja svoje predloge pred odločitvijo organizatorja, spremlja njihov status in vidi svoj urnik. | Ne more potrjevati svojih predlogov, spreminjati programa ali urejati predavanj drugih predavateljev. |
| **Udeleženec** | Pregleduje dogodke, se prijavlja, rezervira predavanja, uporablja čakalni seznam, odpoveduje rezervacije in spremlja osebni urnik. | Ne more ustvarjati dogodkov, potrjevati predavanj ali spreminjati programa. |

Vsak uporabnik ima v prvi različici eno uporabniško vlogo. Organizator lahko upravlja samo svoje dogodke.

## Predvidene funkcionalnosti

Aplikacija bo imela **15 predvidenih funkcionalnosti**. Sedem ključnih funkcionalnosti je označenih z **MVP** in bodo vključene v prvo delujočo različico.

| Št. | Funkcionalnost | Opis | MVP |
|---|---|---|---|
| 1 | Upravljanje dogodkov | Organizator ustvari dogodek ter določi naslov, opis, datum, lokacijo, kapaciteto in stanje objave. | **DA** |
| 2 | Oddaja in potrjevanje predlogov | Predavatelj odda predlog predavanja. Organizator ga pregleda ter potrdi ali zavrne. | **DA** |
| 3 | Priprava programa | Organizator potrjenim predavanjem določi datum, uro in prostor. Sistem prepreči prekrivanje terminov v istem prostoru ali pri istem predavatelju. | **DA** |
| 4 | Prijava na dogodek | Udeleženec se prijavi na objavljen dogodek. Sistem preveri kapaciteto in prepreči podvojene prijave. | **DA** |
| 5 | Rezervacije in osebni urnik | Udeleženec rezervira predavanja, vidi svoj urnik in lahko odpove rezervacijo. Sistem preverja prosta mesta in časovne konflikte. | **DA** |
| 6 | Samodejni čakalni seznam | Če je predavanje zasedeno, se udeleženec lahko prijavi na čakalni seznam. Ob sprostitvi mesta sistem preveri čakajoče in mesto dodeli prvemu ustreznemu udeležencu. | **DA** |
| 7 | Spremljanje zasedenosti | Organizator spremlja število prijav, prosta mesta in zasedenost posameznih predavanj. | **DA** |
| 8 | Iskanje in filtriranje dogodkov | Uporabniki iščejo dogodke po naslovu, datumu in lokaciji ter filtrirajo predavanja po dnevu ali predavatelju. | NE |
| 9 | Integracija z Google Calendar | Udeleženec poveže svoj Google račun z aplikacijo. Rezervirana predavanja se dodajo v njegov koledar, spremembe in odpovedi pa se samodejno posodobijo. | NE |
| 10 | Samodejni potek obravnave predavanj | Sistem vodi predloge skozi določene statuse, od oddaje do objave. Ob spremembi statusa izvede ustrezne korake in pripravi obvestilo predavatelju. | NE |
| 11 | Pametno načrtovanje programa | Sistem preveri proste prostore, kapacitete in razpoložljivost predavateljev ter organizatorju predlaga primerne termine. | NE |
| 12 | Napredna analitika dogodkov | Organizator s pomočjo grafov spremlja število prijav skozi čas, najbolj priljubljena predavanja, zasedenost prostorov in čakalne sezname. | NE |
| 13 | Obvestila uporabnikom | Uporabniki prejmejo obvestila o potrditvah predavanj, spremembah terminov in rezervacijah. | NE |
| 14 | Ocenjevanje predavanj | Udeleženec lahko po koncu predavanja, za katero je imel potrjeno rezervacijo, odda oceno in komentar. | NE |
| 15 | Arhiv dogodkov in poročila | Organizator arhivira zaključene dogodke ter pripravi poročila o prijavah, rezervacijah in ocenah. | NE |

Glavne domensko specifične funkcionalnosti so oddaja in potrjevanje predlogov, priprava programa, rezervacije predavanj, samodejni čakalni seznam in spremljanje zasedenosti.

## Osrednji delovni proces

Glavni proces aplikacije je priprava dogodka, potrjevanje predavanj in upravljanje rezervacij.

1. Organizator ustvari dogodek ter določi datum, lokacijo in kapaciteto.
2. Predavatelj izbere dogodek in odda predlog predavanja.
3. Organizator pregleda predlog ter ga potrdi ali zavrne.
4. Organizator potrjenemu predavanju določi termin in prostor.
5. Sistem preveri, ali je prostor prost in ali predavatelj nima drugega predavanja ob istem času.
6. Organizator objavi dogodek in njegov program.
7. Udeleženec se prijavi na dogodek in izbere predavanja, ki jih želi obiskati.
8. Sistem preveri razpoložljiva mesta in morebitne časovne konflikte.
9. Če je mesto prosto, sistem potrdi rezervacijo in jo doda v osebni urnik.
10. Če je predavanje zasedeno, se lahko udeleženec prijavi na čakalni seznam.
11. Ko nekdo odpove potrjeno rezervacijo, sistem preveri čakalni seznam.
12. Mesto dobi prvi čakajoči udeleženec, ki ima aktivno prijavo in nima časovnega konflikta.
13. Sistem posodobi rezervacije in položaje na čakalnem seznamu.

Če udeleženec ne izpolnjuje pogojev, ga sistem preskoči in preveri naslednjega. Preskočeni udeleženec ostane na čakalnem seznamu.

### Primer naprednejšega delovanja

V kasnejši različici bo udeleženec lahko povezal svoj Google Calendar z aplikacijo EventPro.

Ko rezervira predavanje, se bo termin samodejno dodal v njegov koledar. Če organizator spremeni uro predavanja ali udeleženec odpove rezervacijo, bo aplikacija ustrezno posodobila dogodek v Google Calendar.

Organizatorju bo sistem pomagal tudi pri pripravi programa. Če bo izbrani prostor zaseden ali predavatelj ne bo na voljo, bo predlagal drug primeren termin.

## Kasnejše nadgradnje

Poleg predvidenih funkcionalnosti bo mogoče aplikacijo kasneje razširiti še z naslednjimi možnostmi:

1. **QR-kode** – preverjanje dejanske prisotnosti udeležencev na dogodku.
2. **Elektronska potrdila** – samodejno ustvarjanje potrdil o udeležbi.
3. **Priporočanje predavanj** – predlogi glede na interese in pretekle rezervacije uporabnika.
4. **Večjezičnost** – možnost uporabe aplikacije v različnih jezikih.
5. **Mobilna aplikacija** – razvoj različice za Android in iOS.
6. **Upravljanje več organizatorjev** – več organizatorjev lahko skupaj pripravlja isti dogodek.
7. **Izvoz podatkov** – prenos statistike in poročil v CSV ali PDF.

## Out of scope

Naslednjih funkcionalnosti v okviru projekta ne bomo razvijali:

- Spletno plačevanje kotizacij in izdajanje računov.
- Rezervacija hotelov, prevozov in turističnih storitev.
- Prenos predavanj v živo in shranjevanje videoposnetkov.
- Prodaja vstopnic prek zunanjih sistemov.
- Samodejno ustvarjanje celotnega programa z umetno inteligenco.

## Meje prve različice

Prva različica aplikacije bo namenjena organizaciji konferenc, seminarjev in delavnic.

Vsak dogodek bo imel enega organizatorja. Vsako predavanje bo pripadalo enemu dogodku in bo imelo enega predavatelja. Organizator bo določil termin in prostor predavanja ter kapaciteto dogodka. Kapaciteto posameznega predavanja bo določala kapaciteta njegovega prostora.

Uporabnik se bo lahko na isti dogodek prijavil samo enkrat. Na posamezno predavanje bo lahko imel eno potrjeno rezervacijo ali eno mesto na čakalnem seznamu.

Prijave in rezervacije bodo brezplačne. Sistem bo preverjal kapaciteto dogodkov, prosta mesta na predavanjih in časovne konflikte.

V prvo različico bodo vključeni tudi odpoved rezervacij, samodejni čakalni seznam in osnovni pregled zasedenosti.

Naprednejše funkcionalnosti, kot so integracija z Google Calendar, predlaganje prostih terminov, analitika in ocenjevanje predavanj, bodo vključene v kasnejših fazah razvoja.
