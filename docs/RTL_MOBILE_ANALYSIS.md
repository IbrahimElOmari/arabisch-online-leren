# RTL Mobile Layout Analysis Report

## Probleembeschrijving
Wanneer de applicatie op Arabisch (RTL) wordt gezet op mobiele apparaten:
1. **Ernstig probleem**: De inhoud van de pagina verschuift tot buiten het scherm en is onzichtbaar
2. **Minder ernstig**: In Nederlandse en andere talen is de inhoud wel zichtbaar maar smal en opgepropt

## 5 Oorzaken in de Code

### 1. **Ontbrekende `overflow-x: hidden` op Root RTL Containers** ⭐ MEEST WAARSCHIJNLIJK
**Locatie**: `src/components/layout/AppLayout.tsx`, `src/index.css`, `src/styles/rtl.css`

**Probleem**: Wanneer de `direction: rtl` wordt toegepast, worden elementen standaard aan de rechterkant van hun container gepositioneerd. Als de content breder is dan het viewport (door fixed widths, margins, of padding), kan dit resulteren in horizontale overflow die de content "van het scherm duwt".

**Waarom dit de hoofdoorzaak is**:
- De `AppLayout.tsx` component had geen expliciete `max-width: 100vw` en `overflow-x: hidden` op de root container
- In RTL mode worden margins en paddings gespiegeld, maar als deze niet correct zijn ingesteld, kan content naar links verschuiven en buiten het viewport vallen
- Op mobiel is dit extra problematisch omdat er minder ruimte is voor overflow

**Fix toegepast**:
```css
[dir="rtl"] body,
[dir="rtl"] main,
[dir="rtl"] .min-h-screen {
  width: 100% !important;
  max-width: 100vw !important;
  overflow-x: hidden !important;
}
```

---

### 2. **Conflicterende Flexbox Direction Properties**
**Locatie**: `src/styles/rtl.css` lijnen 72-74, `src/index.css`

**Probleem**: De CSS bevat regels die `.rtl .flex` beïnvloeden:
```css
.rtl .flex {
  direction: inherit;
}
```

Wanneer flex containers `direction: inherit` krijgen in combinatie met `flex-direction: row`, kan dit leiden tot onvoorspelbaar gedrag waarbij items buiten hun container worden geplaatst.

**Impact**: Middelmatig - Dit zorgt voor inconsistent gedrag maar is niet de primaire oorzaak.

---

### 3. **Fixed Width Containers zonder RTL-aware Sizing**
**Locatie**: `src/pages/Index.tsx`, diverse componenten

**Probleem**: Containers zoals `max-w-7xl` en `max-w-4xl` hebben fixed maximum widths die niet altijd goed werken met RTL:
```tsx
<div className="max-w-7xl mx-auto px-4">
```

In RTL mode kan `mx-auto` (margin-left/right: auto) anders worden geïnterpreteerd, wat leidt tot:
- Content die aan de verkeerde kant van het scherm wordt gecentreerd
- Horizontale scrolling op mobiel

**Fix toegepast**:
```css
[dir="rtl"] .max-w-7xl,
[dir="rtl"] .max-w-4xl {
  max-width: 100%;
  box-sizing: border-box;
}
```

---

### 4. **Sidebar Width Interference in RTL Mode**
**Locatie**: `src/components/ui/sidebar.tsx` lijnen 22-24

**Probleem**: De sidebar definieert fixed widths:
```tsx
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "90vw"
```

Wanneer de sidebar in RTL mode wordt geopend of zijn ruimte reserveert, kan dit de beschikbare ruimte voor de main content beïnvloeden. De `flex-1` container krijgt dan negatieve of zeer kleine breedte.

**CSS in rtl.css**:
```css
.rtl .flex-1 {
  order: 1;
}
```

Dit verandert de volgorde maar lost het breedteprobleem niet op.

---

### 5. **Grid Layout Direction Issues**
**Locatie**: `src/styles/rtl.css` lijnen 377-380

**Probleem**: De grid direction fix kan onbedoelde gevolgen hebben:
```css
.rtl .grid {
  direction: rtl;
}
```

Wanneer grids expliciet `direction: rtl` krijgen terwijl de parent al RTL is, kan dit dubbele transformaties veroorzaken die items buiten het grid plaatsen.

---

## Analyse: Meest Waarschijnlijke Oorzaak

### **Oorzaak 1 is de hoofdoorzaak** met de volgende onderbouwing:

1. **Symptoom match**: "Content verschuift buiten het scherm" is precies wat gebeurt wanneer:
   - `direction: rtl` wordt toegepast
   - Containers geen expliciete `overflow-x: hidden` hebben
   - Content met fixed widths of margins naar links "vloeit"

2. **Mobile-specifiek**: Op desktop is er meer ruimte waardoor overflow minder merkbaar is. Op mobiel (< 768px) is het viewport smaller en wordt elke overflow direct zichtbaar.

3. **Taal-afhankelijk**: Het probleem treedt alleen op bij Arabisch (RTL) omdat:
   - Nederlandse/andere talen gebruiken `direction: ltr` (standaard)
   - Bij LTR vloeit overflow naar rechts (minder zichtbaar door scroll)
   - Bij RTL vloeit overflow naar links, waardoor de content "verdwijnt"

4. **"Smal opgepropt" in andere talen**: Dit is een secundair symptoom van dezelfde oorzaak:
   - De flex containers hebben `min-width: 0` nodig om correct te krimpen
   - Zonder dit worden containers geforceerd tot minimale breedte

## Toegepaste Fixes

1. **AppLayout.tsx**: Expliciete `dir` attribute en `overflow-x-hidden` classes toegevoegd
2. **index.css**: Mobile-specifieke RTL fixes met `!important` voor overflow control
3. **rtl.css**: Verbeterde container width management
4. **mobile-optimizations.css**: RTL-specifieke mobile overrides

## Verificatie

Test de fix door:
1. Open de app op mobiel (of Chrome DevTools mobile view)
2. Schakel naar Arabisch in de taalkeuzr
3. Verifieer dat:
   - Content zichtbaar blijft binnen het viewport
   - Geen horizontale scroll bar verschijnt
   - Layout correct RTL is (tekst rechts uitgelijnd, iconen gespiegeld)

## Aanbevelingen voor Toekomstige Ontwikkeling

1. **Gebruik CSS Logical Properties**: Vervang `margin-left/right` door `margin-inline-start/end`
2. **Test altijd in RTL mode**: Voeg RTL tests toe aan de E2E test suite
3. **Vermijd fixed widths op mobile**: Gebruik percentages of viewport units
4. **Documenteer RTL-vereisten**: Voeg RTL checklist toe aan component guidelines
