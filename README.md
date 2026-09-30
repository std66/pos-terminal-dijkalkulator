# Bankkártya-elfogadási díjkalkulátor

Magyar vállalkozások számára készült, böngészőben futó kalkulátor. Tranzakciós CSV-fájl alapján összesíti a banki és POS-szolgáltatói díjakat, valamint a díjak után fennmaradó összeget.

**Készítette:** Sinku Tamás (sinkutamas@gmail.com)

**Megjegyzés:** AI-generált projekt.

## Használat

1. Nyisd meg az `index.html` fájlt egy modern böngészőben. A kalkulátor szerver és internetkapcsolat nélkül, `file://` protokollról is használható.
2. Válaszd ki a banki és POS-szolgáltatói díjszabást.
3. Tölts fel egy UTF-8 kódolású CSV-fájlt.
4. A kalkulátor megjeleníti a CSV tranzakciói alapján számított díjakat és összesítéseket.

Nincs szükség telepítésre vagy külső függőségekre.

## CSV-formátum

A fájl fejlécének pontosan a `date`, `card_type` és `amount` oszlopokat kell tartalmaznia; az oszlopok sorrendje tetszőleges. A CSV idézőjelezése és az UTF-8 BOM kezelése támogatott.

```csv
date,card_type,amount
2026-09-01,vi_ret_db,59270
2026-10-02,vi_bus_db,100000
```

- `date`: valós naptári dátum `YYYY-MM-DD` formátumban.
- `card_type`: az alábbi támogatott kódok egyike:
  `mc_ret_db`, `mc_ret_cr`, `vi_ret_db`, `vi_ret_cr`, `mc_bus_db`, `mc_bus_cr`, `vi_bus_db`, `vi_bus_cr`, `maestro`.
- `amount`: pozitív, egész forintösszeg.

Hibás vagy hiányos sor esetén a fájl feldolgozása leáll, és a felület hibaüzenetet mutat.

## Elérhető díjszabások

### Bankok

- **O.F.SZ. Zrt.** – Interchange Pass-Through. A kalkuláció a bemutatott modell szerint az összes tranzakcióhoz a „más bank által kibocsátott” kártyák bankközi díjait alkalmazza.
- **OTP Bank** – költségalapú, IC++ jellegű modell. A számítás 0,99%-os kereskedői díjjal és a tarifafájlban megadott kártyakategória-feltevésekkel dolgozik.

### POS-szolgáltatók

- **Fizetési Pont** – tranzakciónként 7 Ft + 0,4% nettó díj, valamint havi 2 350 Ft nettó termináldíj.
- **SimplePay - Hordozható POS terminál** – havi 5 000 Ft nettó termináldíj; minden más megadott díjtétel 0 Ft.

A POS nettó díjaira a konfigurációban megadott 27%-os ÁFA-kulcs kerül. A havi fix díj a CSV-ben előforduló különböző naptári hónapok száma szerint számítódik: csak a fájlban előforduló hónapok után terhelődik havi díj.

## Számítási tudnivalók

- A banki díjösszetevők tranzakciónként egész forintra kerekítődnek, majd kártyatípusonként összegeződnek.
- A POS változó nettó díjai tranzakciónként kerekítődnek; az ÁFA is a kerekített nettó tranzakciós díjra kerül kiszámításra és kerekítésre.
- A havi POS-díj és annak ÁFÁ-ja minden, a CSV-ben előforduló különböző naptári hónapra felszámítódik.
- A riport a feltöltött tranzakciók időszakára mutat darabszámot, forgalmat, díjakat és díjak utáni bevételt; nem vetíti ezeket havi vagy éves átlagra.
- A havi számlavezetési díj és az éves kártyadíj jelenleg 0 Ft-os placeholder.

## Fontos

A kalkulátor tájékoztató becslést ad, nem hivatalos ajánlat. Az OTP 0,99%-os kereskedői díja feltevés, mivel a tényleges díj szerződéses; az üzleti kártyák bankközi díjai szintén egyszerűsített feltevésen alapulnak. A díjak és a kártyakategóriák tényleges feltételeit mindig ellenőrizd a szolgáltatóval kötött szerződésben és az aktuális hirdetményekben.

## Projektfájlok

- `index.html` – a kalkulátor felülete.
- `styles.css` – megjelenés.
- `app.js` – CSV-feldolgozás, díjszámítás és felületfrissítés.
- `tariffs.js` – banki és POS-szolgáltatói tarifák.
- `task.txt` – az eredeti feladatleírás.
