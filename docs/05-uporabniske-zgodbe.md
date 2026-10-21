# EventPro – uporabniške zgodbe in sprejemni kriteriji

Dokument temelji na 15 funkcionalnostih iz `02-funkcionalnosti-in-obseg.md`. Zgodbe **US-01–US-07** so del prve različice (**MVP**); zgodbe **US-08–US-15** so predvidene za nadaljnji razvoj. Vsaka zgodba ima štiri preverljive sprejemne kriterije.

## Pregled uporabniških zgodb

| Oznaka | Funkcionalnost | Vloga | MVP |
|---|---|---|---|
| US-01 | Upravljanje dogodkov | Organizator | DA |
| US-02 | Oddaja in potrjevanje predlogov | Predavatelj / organizator | DA |
| US-03 | Priprava programa | Organizator | DA |
| US-04 | Prijava na dogodek | Udeleženec | DA |
| US-05 | Rezervacije in osebni urnik | Udeleženec | DA |
| US-06 | Samodejni čakalni seznam | Udeleženec | DA |
| US-07 | Spremljanje zasedenosti | Organizator | DA |
| US-08 | Iskanje in filtriranje dogodkov | Udeleženec | NE |
| US-09 | Integracija z Google Calendar | Udeleženec | NE |
| US-10 | Samodejni potek obravnave predavanj | Organizator | NE |
| US-11 | Pametno načrtovanje programa | Organizator | NE |
| US-12 | Napredna analitika dogodkov | Organizator | NE |
| US-13 | Obvestila uporabnikom | Predavatelj / udeleženec | NE |
| US-14 | Ocenjevanje predavanj | Udeleženec | NE |
| US-15 | Arhiv dogodkov in poročila | Organizator | NE |

## Podrobne uporabniške zgodbe

### US-01 – Upravljanje dogodkov

**Povezana funkcionalnost:** 1. Upravljanje dogodkov  
**Uporabniška vloga:** Organizator  
**Obseg:** MVP

**Uporabniška zgodba:**

*Kot organizator želim ustvariti in objaviti dogodek, da lahko predavatelji oddajo predloge, udeleženci pa se prijavijo.*

**Sprejemni kriteriji:**

1. Ob ustvarjanju dogodka so obvezni naslov, opis, lokacija, začetni in končni datum ter kapaciteta, ki mora biti celo število, večje od 0.
2. Sistem zavrne shranjevanje, če je končni datum pred začetnim ali če manjka obvezni podatek, in označi napačna polja.
3. Nov dogodek se shrani s statusom OSNUTEK in ni prikazan udeležencem med objavljenimi dogodki.
4. Samo organizator, ki je ustvaril dogodek, ga lahko ureja in objavi; objava uspe le, če ima dogodek vsaj eno razporejeno predavanje.

### US-02 – Oddaja in potrjevanje predlogov

**Povezana funkcionalnost:** 2. Oddaja in potrjevanje predlogov  
**Uporabniška vloga:** Predavatelj / organizator  
**Obseg:** MVP

**Uporabniška zgodba:**

*Kot predavatelj želim oddati predlog predavanja, da ga organizator lahko pregleda in vključi v program.*

**Sprejemni kriteriji:**

1. Predavatelj lahko odda predlog z naslovom, povzetkom in trajanjem v minutah za izbrani dogodek, ki sprejema predloge.
2. Sistem zavrne predlog, če naslov ali povzetek manjka ali če trajanje ni pozitivno celo število.
3. Novo oddan predlog dobi status ODDANO; predavatelj ga lahko ureja samo v tem statusu.
4. Organizator dogodka lahko predlog potrdi ali zavrne; po odločitvi se status posodobi in predavatelj ga vidi v seznamu svojih predlogov.

### US-03 – Priprava programa

**Povezana funkcionalnost:** 3. Priprava programa  
**Uporabniška vloga:** Organizator  
**Obseg:** MVP

**Uporabniška zgodba:**

*Kot organizator želim potrjenim predavanjem določiti prostor in termin, da sestavim izvedljiv program brez prekrivanj.*

**Sprejemni kriteriji:**

1. Razporediti je mogoče samo predavanje s statusom POTRJENO in samo v prostor, ki pripada istemu dogodku.
2. Sistem izračuna konec termina iz začetka in trajanja ter zavrne termin zunaj časovnega obsega dogodka.
3. Sistem zavrne razporeditev, če se termin prekriva z drugim predavanjem v istem prostoru ali pri istem predavatelju.
4. Po uspešni razporeditvi se predavanje prikaže v programu z datumom, začetkom, koncem in prostorom.

### US-04 – Prijava na dogodek

**Povezana funkcionalnost:** 4. Prijava na dogodek  
**Uporabniška vloga:** Udeleženec  
**Obseg:** MVP

**Uporabniška zgodba:**

*Kot udeleženec želim prijaviti se na objavljen dogodek, da lahko rezerviram mesta na njegovih predavanjih.*

**Sprejemni kriteriji:**

1. Gumb »Prijavi se« je na voljo prijavljenemu udeležencu samo pri objavljenem dogodku, za katerega prijave še potekajo.
2. Če je število aktivnih prijav manjše od kapacitete dogodka, sistem ustvari aktivno prijavo.
3. Če je dogodek poln, sistem ne ustvari prijave in prikaže sporočilo »Dogodek je zaseden«.
4. Ponovna prijava istega uporabnika na isti dogodek ne ustvari druge aktivne prijave.

### US-05 – Rezervacije in osebni urnik

**Povezana funkcionalnost:** 5. Rezervacije in osebni urnik  
**Uporabniška vloga:** Udeleženec  
**Obseg:** MVP

**Uporabniška zgodba:**

*Kot udeleženec želim rezervirati predavanja in jih videti v osebnem urniku, da si organiziram obisk dogodka.*

**Sprejemni kriteriji:**

1. Rezervacijo lahko ustvari samo udeleženec z aktivno prijavo na dogodek.
2. Če je na predavanju prosto mesto in nima prekrivajoče se potrjene rezervacije, sistem ustvari rezervacijo s statusom POTRJENA.
3. Če ima udeleženec že potrjeno rezervacijo za isti termin ali isto predavanje, sistem novo rezervacijo zavrne in pojasni razlog.
4. Osebni urnik prikazuje potrjene rezervacije po začetnem času; udeleženec lahko rezervacijo odpove, po odpovedi pa se odstrani iz potrjenega urnika.

### US-06 – Samodejni čakalni seznam

**Povezana funkcionalnost:** 6. Samodejni čakalni seznam  
**Uporabniška vloga:** Udeleženec  
**Obseg:** MVP

**Uporabniška zgodba:**

*Kot udeleženec želim vstopiti na čakalni seznam zasedenega predavanja, da lahko dobim mesto, ko se sprosti.*

**Sprejemni kriteriji:**

1. Če je predavanje zasedeno, lahko udeleženec z aktivno prijavo izbere »Pridruži se čakalnemu seznamu«; sistem ga doda največ enkrat.
2. Čakajoči so razvrščeni po času vključitve, od najstarejšega do najnovejšega; udeleženec vidi svoj trenutni položaj.
3. Ob odpovedi potrjene rezervacije sistem v isti obdelavi preveri čakajoče po vrstnem redu in potrdi mesto prvemu z aktivno prijavo in brez časovnega konflikta.
4. Čakajočega, ki trenutno ne izpolnjuje pogojev, sistem preskoči brez brisanja s seznama; ob uspešni dodelitvi se kapaciteta ne preseže.

### US-07 – Spremljanje zasedenosti

**Povezana funkcionalnost:** 7. Spremljanje zasedenosti  
**Uporabniška vloga:** Organizator  
**Obseg:** MVP

**Uporabniška zgodba:**

*Kot organizator želim spremljati zasedenost dogodka in predavanj, da pravočasno opazim pomanjkanje prostih mest.*

**Sprejemni kriteriji:**

1. Organizator vidi število aktivnih prijav in kapaciteto za vsak svoj dogodek.
2. Za vsako razporejeno predavanje vidi število potrjenih rezervacij, kapaciteto prostora in število čakajočih.
3. Število prostih mest se izračuna kot kapaciteta minus potrjene rezervacije in ne more biti negativno.
4. Po prijavi, rezervaciji, odpovedi ali samodejni dodelitvi mesta se prikaz ob osvežitvi strani ujema s podatki v sistemu.

### US-08 – Iskanje in filtriranje dogodkov

**Povezana funkcionalnost:** 8. Iskanje in filtriranje dogodkov  
**Uporabniška vloga:** Udeleženec  
**Obseg:** Kasnejša faza

**Uporabniška zgodba:**

*Kot udeleženec želim iskati dogodke in filtrirati predavanja, da hitreje najdem vsebine, ki me zanimajo.*

**Sprejemni kriteriji:**

1. Iskanje po naslovu vrne objavljene dogodke, katerih naslov vsebuje vneseno besedilo, ne glede na velike in male črke.
2. Filter po datumu vrne dogodke, ki potekajo na izbrani datum; filter po lokaciji vrne dogodke z izbrano lokacijo.
3. Pri izbranem dogodku je mogoče program filtrirati po dnevu in predavatelju; hkratna filtra se uporabita skupaj.
4. Če ni zadetkov, sistem prikaže »Ni zadetkov« in omogoči ponastavitev filtrov.

### US-09 – Integracija z Google Calendar

**Povezana funkcionalnost:** 9. Integracija z Google Calendar  
**Uporabniška vloga:** Udeleženec  
**Obseg:** Kasnejša faza

**Uporabniška zgodba:**

*Kot udeleženec želim povezati Google Calendar z EventPro, da se moja rezervirana predavanja samodejno usklajujejo s koledarjem.*

**Sprejemni kriteriji:**

1. Povezava se vzpostavi šele po uporabnikovi odobritvi ustreznih dovoljenj prek Googlove prijave OAuth 2.0.
2. Po uspešni povezavi sistem za novo potrjeno rezervacijo ustvari koledarski dogodek z naslovom, začetkom, koncem in lokacijo predavanja.
3. Ob spremembi termina ali odpovedi rezervacije sistem posodobi oziroma odstrani ustrezen dogodek v Google Calendar.
4. Če uporabnik prekliče dovoljenje ali Google API vrne napako, rezervacija v EventPro ostane veljavna, uporabnik pa vidi neuspešno sinhronizacijo.

### US-10 – Samodejni potek obravnave predavanj

**Povezana funkcionalnost:** 10. Samodejni potek obravnave predavanj  
**Uporabniška vloga:** Organizator  
**Obseg:** Kasnejša faza

**Uporabniška zgodba:**

*Kot organizator želim voditi predloge skozi določene korake obravnave, da je odločanje pregledno in sledljivo.*

**Sprejemni kriteriji:**

1. Predlog lahko prehaja samo po dovoljenih prehodih: ODDANO → POTRJENO ali ZAVRNJENO; POTRJENO → RAZPOREJENO; RAZPOREJENO → OBJAVLJENO.
2. Sistem zavrne nedovoljen prehod statusa in ne spremeni podatkov predloga.
3. Ob vsaki uspešni spremembi statusa sistem zabeleži uporabnika, čas spremembe ter prejšnji in novi status.
4. Ob potrditvi ali zavrnitvi sistem ustvari obvestilo za predavatelja; ob zavrnitvi organizator vnese razlog.

### US-11 – Pametno načrtovanje programa

**Povezana funkcionalnost:** 11. Pametno načrtovanje programa  
**Uporabniška vloga:** Organizator  
**Obseg:** Kasnejša faza

**Uporabniška zgodba:**

*Kot organizator želim dobiti predloge prostih terminov in prostorov, da hitreje sestavim program brez konfliktov.*

**Sprejemni kriteriji:**

1. Organizator izbere potrjeno predavanje, datum in želen časovni interval za iskanje predlogov.
2. Sistem vrne samo prostore, katerih kapaciteta zadostuje zahtevani kapaciteti predavanja in so v izbranem terminu prosti.
3. Predlagani termini ne smejo biti v konfliktu z drugimi predavanji istega predavatelja ali z njegovo označeno nerazpoložljivostjo.
4. Če primernega termina ni, sistem prikaže »Ni razpoložljivih terminov«; predlog se v program shrani šele po potrditvi organizatorja.

### US-12 – Napredna analitika dogodkov

**Povezana funkcionalnost:** 12. Napredna analitika dogodkov  
**Uporabniška vloga:** Organizator  
**Obseg:** Kasnejša faza

**Uporabniška zgodba:**

*Kot organizator želim videti grafe prijav in rezervacij, da lahko ocenim zanimanje za svoj dogodek.*

**Sprejemni kriteriji:**

1. Za izbrani dogodek sistem prikaže število novih prijav po dnevih v izbranem časovnem obdobju.
2. Graf zasedenosti prikazuje delež potrjenih rezervacij glede na kapaciteto vsakega predavanja.
3. Seznam najbolj priljubljenih predavanj je razvrščen po številu potrjenih rezervacij; pri izenačenju po naslovu.
4. Podatki vključujejo samo dogodke izbranega organizatorja in ne prikazujejo osebnih podatkov udeležencev.

### US-13 – Obvestila uporabnikom

**Povezana funkcionalnost:** 13. Obvestila uporabnikom  
**Uporabniška vloga:** Predavatelj / udeleženec  
**Obseg:** Kasnejša faza

**Uporabniška zgodba:**

*Kot uporabnik želim prejeti obvestilo o pomembnih spremembah, da ne spregledam odločitve ali spremembe urnika.*

**Sprejemni kriteriji:**

1. Predavatelj prejme obvestilo, ko organizator potrdi ali zavrne njegov predlog.
2. Udeleženec prejme obvestilo, ko se spremeni termin predavanja, za katero ima potrjeno rezervacijo.
3. Vsako obvestilo vsebuje vrsto dogodka, naziv predavanja, čas nastanka in povezavo do povezanega zapisa.
4. Uporabnik lahko obvestilo označi kot prebrano; prebrano obvestilo se ne šteje več med neprebrana.

### US-14 – Ocenjevanje predavanj

**Povezana funkcionalnost:** 14. Ocenjevanje predavanj  
**Uporabniška vloga:** Udeleženec  
**Obseg:** Kasnejša faza

**Uporabniška zgodba:**

*Kot udeleženec želim po koncu predavanja oddati oceno in komentar, da organizatorju pomagam izboljšati prihodnje dogodke.*

**Sprejemni kriteriji:**

1. Ocenjevanje je omogočeno šele po koncu predavanja in samo udeležencu, ki je imel potrjeno rezervacijo.
2. Ocena mora biti celo število od 1 do 5; komentar je neobvezen in lahko vsebuje največ 1000 znakov.
3. Uporabnik lahko odda največ eno oceno za isto predavanje; ponovna oddaja ustvari napako namesto dvojnika.
4. Organizator vidi povprečno oceno in komentarje samo za predavanja svojih dogodkov.

### US-15 – Arhiv dogodkov in poročila

**Povezana funkcionalnost:** 15. Arhiv dogodkov in poročila  
**Uporabniška vloga:** Organizator  
**Obseg:** Kasnejša faza

**Uporabniška zgodba:**

*Kot organizator želim arhivirati zaključene dogodke in prenesti poročilo, da ohranim pregled nad izvedenimi dogodki.*

**Sprejemni kriteriji:**

1. Arhiviranje je dovoljeno samo, ko je končni datum dogodka v preteklosti.
2. Po arhiviranju dogodka ni več mogoče ustvarjati novih prijav in rezervacij, njegov program pa ostane viden za pregled.
3. Organizator lahko za svoj arhivirani dogodek prenese poročilo CSV s številom prijav, rezervacij in povprečnimi ocenami po predavanjih.
4. Uporabnik brez pravic organizatorja tega dogodka ne more prenesti organizatorjevega poročila.

## Opombe o obsegu in preverljivosti

- Za funkcionalnosti MVP so vključeni osnovni pogoji za prijave, rezervacije, odpovedi, preverjanje konfliktov in samodejno dodeljevanje mest s čakalnega seznama.
- Samodejni prehodi med dodatnimi statusi, napredna analitika in Google Calendar sinhronizacija sodijo v kasnejšo fazo; ne spreminjajo obsega MVP.
- Kapaciteta predavanja v prvi različici izhaja iz kapacitete dodeljenega prostora.
- Pogoje je mogoče preveriti s funkcionalnimi testi, testi pravic dostopa in preverjanjem shranjenih podatkov.
