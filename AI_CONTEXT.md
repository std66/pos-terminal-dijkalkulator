# AI context – bankkártya-elfogadási díjkalkulátor

## A projekt célja

Magyar kisvállalkozások számára készülő, szerver nélkül, `file://` protokollról is használható bankkártya-elfogadási díjkalkulátor. Technológia: HTML5, különálló CSS és vanilla JavaScript; külső függőség nem használható. A felhasználó banki és POS-díjszabást választ, majd tranzakciónkénti CSV-fájlt választ a díjak pontosabb kiszámításához.

## Aktuális fájlok

- `index.html` – magyar nyelvű kalkulátor UI
- `styles.css` – letisztult, desktopra tervezett stílus
- `app.js` – számítás, felületfrissítés és bemeneti validáció
- `tariffs.js` – előre definiált szolgáltatói díjak és tájékoztató üzenetek
- `task.txt` – eredeti feladatleírás
- `otpbank.md`, `visa.md`, `mastercard.md` – forrásként használt hirdetmény/díjtáblák
- `AI_CONTEXT.md` – munkamenetek közötti átadási jegyzet

## Rögzített üzleti szabályok és feltételezések

- A bemenet UTF-8 CSV-fájl, pontosan `date,card_type,amount` oszlopokkal. Az oszlopok sorrendje tetszőleges, de mindháromnak szerepelnie kell.
- A támogatott `card_type` értékek: `mc_ret_db`, `mc_ret_cr`, `vi_ret_db`, `vi_ret_cr`, `mc_bus_db`, `mc_bus_cr`, `vi_bus_db`, `vi_bus_cr`, `maestro`.
- A dátum formátuma `yyyy-mm-dd`; az összeg pozitív egész forint. CSV quoting és BOM kezelt.
- A banki díjösszetevők tranzakciónként egész forintra kerekítődnek, majd kártyatípusonként összegeződnek.
- A Fizetési Pont változó nettó díja tranzakciónként (7 Ft + az eredeti összeg 0,4%-a) kerekítődik; az ÁFA a tranzakciónként kerekített nettó díjra kerül.
- A POS havi fix díja a CSV-ben előforduló különböző naptári hónapok száma szerint számítódik, nem a legrégebbi és legújabb dátum közötti hiányzó hónapok alapján.
- A riport a feltöltött tranzakciók dátumintervallumára mutat összesített darabszámot, forgalmat, díjakat és díjak utáni bevételt; nem vetíti éves vagy havi átlagra.
- A díjadatoknál az OFSZ és a Fizetési Pont mellett az OTP Bank is szerepel.
- Az OFSZ worst-case számításában minden tranzakcióra a táblázat „más bank által kibocsátott” bankközi díja érvényes.
- Az OTP saját kártyáit kizárjuk; kilenc CSV-kártyakód van a szűkített listában: Mastercard/Visa lakossági debit és credit, Mastercard/Visa üzleti debit és credit, továbbá lakossági Maestro.
- OTP lakossági interchange feltevések: Mastercard debit 0,20%, credit 0,30%; Visa debit 0,20%, credit 0,30%; Maestro 0,20%.
- OTP üzleti kártyák interchange feltevése: VISA és Mastercard debitre és creditre egyaránt 1,65%, a felhasználó kifejezett döntése alapján. Ez egyszerűsített becslés, nem minden üzleti termékszint worst-case értéke.
- OTP kereskedői díj: 0,7%-os nyilvános példaérték; az OTP tényleges kereskedői díja egyedi szerződéses. A felület ezt figyelmeztető üzenetben jelzi.
- OTP rendszerdíjak a `otpbank.md` forintos, belföldi nem OTP kártyákra vonatkozó soraiból származnak. Ezek a táblázatban fix Ft/tranzakció + százalékos díjként szerepelnek.
- Az OTP díjrendszer költségalapú / IC++ jellegű: kereskedői díj + bankközi jutalék + rendszerdíj.
- A Fizetési Pont tranzakciós díja 7 Ft + a forgalom 0,4%-a; terminál havi díja 2350 Ft; a nettó POS-díjakra 27% ÁFA kerül.
- Havi számlavezetési és éves kártyadíjak egyelőre 0 Ft-os, kommentelt placeholderként szerepelnek.
- Szolgáltatói tájékoztató üzenetek adatstruktúrája: `messages: [{ type: "info" | "warn", text: "..." }]`.

## Aktuális implementációs részletek

- A `tariffs.js` tartalmazza az OFSZ-t és az OTP-t a `banks` alatt, a Fizetési Pontot a `terminals` alatt.
- A `app.js` CSV-feldolgozója validálja a fejlécet, oszlopszámot, dátumot, kártyakódot és egész forint összeget; hibás fájlnál leáll és hibaüzenetet jelenít meg. Az oszlopok sorrendje tetszőleges, a BOM és CSV idézőjelezés támogatott.
- Az eredményeket kártyatípusonként csoportosítja (darabszám, forgalom, merchant, interchange, scheme, total).
- A kártyatípusok a két banki tariffban a `csvType` mezővel vannak összekapcsolva.
- A bankválasztótól független CSV-validálás az összes tarifában támogatott kód unióját fogadja el; ha az aktuálisan kiválasztott bank nem definiál egy adott kódot, a díjszámítás érthető hibával leáll.
- A banki díjak tranzakciónként számítódnak: a kereskedői százalék, interchange és rendszerdíj komponensei egyenként egész forintra kerekítődnek, majd a díjkomponenseket összegzi.
- A POS változó nettó díja tranzakciónként `round(fix + összeg * százalék)`; az ÁFA minden tranzakció már kerekített nettó díjára külön kerekítődik, majd összeadódik.
- A POS havi nettó fix díj és annak ÁFÁ-ja külön-külön egy hónapra kerekítődik, majd szorozva van a CSV-ben előforduló különböző hónapok számával.
- A kártyasoronkénti `schemeFixed` és `schemeRate` lehetővé teszi az OTP rendszerdíjainak kártyánkénti eltérését; az OFSZ ezeket banki szinten határozza meg.
- A kiválasztott bank és POS-szolgáltató `messages` elemei dinamikusan jelennek meg.
- A banki eredménytábla oszlopának neve „Rendszerdíj”; az OFSZ kártyatársasági díja és az OTP rendszerdíja ugyanabban az oszlopban jelenik meg.
- A bankválasztó a díjmodell nevét is mutatja (OFSZ: Interchange Pass-Through; OTP: költségalapú / IC++ jellegű).

## Legutóbbi ellenőrzés

- `node --check app.js` és `node --check tariffs.js` sikeres.
- Node DOM-mock alapú végponttól végpontig teszt sikeresen ellenőrizte a CSV-importot BOM-mal, eltérő fejlécoszlop-sorrenddel, két naptári hónapot érintő adatokkal, OFSZ- és OTP-eredményekkel, szolgáltatói figyelmeztetésekkel és hibás dátum/kártyakód bemenetekkel.
- Külön ellenőrzés igazolta, hogy a kilenc támogatott CSV-kártyakód mindkét bank tarifájában pontosan egyszer szerepel.
- A tesztelt több hónapos példában 2026-09-01 `vi_ret_db` 59 270 Ft és 2026-10-02 `vi_bus_db` 100 000 Ft tranzakciók szerepeltek.

## Lehetséges következő ellenőrzések / nyitott megjegyzések

- A kalkulátor becslés, nem hivatalos ajánlat. Az OTP 0,7%-os kereskedői díja és az üzleti kártyák 1,65%-os interchange értéke feltevésként van kezelve.
- A `visa.md` EGT-n belüli, határon átnyúló díjtáblát, a `mastercard.md` magyarországi belföldi táblát tartalmaz. Az OTP-s egyszerűsített kalkuláció ezek díjait a rögzített feltevések szerint használja; a különböző kibocsátási régiók nincsenek a felületen modellezve.
- A Visa üzleti táblázatban a Visa Business Debit/Credit Standard értéke 1,65%, de a Platinum és Infinite szintek ennél magasabbak. A Mastercard táblák sem garantálják, hogy minden termék általános Base díja 1,65%; ez a felhasználó által elfogadott egyszerűsítés.
- A terminal provider választó jelenleg egy szolgáltatót tartalmaz. A banki modellválasztás és szolgáltatói üzenetek be vannak vezetve, de külön Blended/IC++ tarifacsomag-példák nincsenek felvéve.
- A CSV-lista nem tartalmazza a korábbi OFSZ-bemenetben szereplő V PAY-t, mert a felhasználó által megadott CSV-kódok között nincs hozzá kód.
- A projektkönyvtár a munkamenet megkezdésekor nem volt Git repository.
