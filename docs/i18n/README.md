# 🌍 Internationalisatie (i18n) Documentatie

Welkom bij de i18n documentatie voor het Arabisch Leerplatform.

## 📖 Inhoud

1. [Vertaalworkflow](./vertaalworkflow.md)
2. [Terminologie Lijst](./terminologie.md)
3. [RTL Ondersteuning](./rtl-support.md)
4. [Locale Keys Structuur](./locale-keys.md)

## 🎯 Overzicht

Ons platform ondersteunt **3 talen**:
- 🇳🇱 **Nederlands** (NL) - Primaire taal
- 🇬🇧 **Engels** (EN) - Internationale gebruikers
- 🇸🇦 **Arabisch** (AR) - Native speakers en referentie

## 🔑 Key Principes

### 1. **Complete Coverage**
Alle UI-elementen, instructies en content moeten in alle 3 talen beschikbaar zijn.

### 2. **Cultural Context**
Vertalingen zijn niet letterlijk maar cultureel relevant:
- Voorbeelden aangepast aan lokale context
- Idiomen correct vertaald
- Respectvolle tone of voice

### 3. **RTL Support**
Arabisch wordt van rechts naar links gelezen:
- Layout mirroring
- Text alignment
- Icon positioning
- Navigation flow

### 4. **Consistency**
Vaste terminologie voor technische termen:
- "Les" = "Lesson" = "درس"
- "Niveau" = "Level" = "مستوى"
- "Oefening" = "Exercise" = "تمرين"

## 📂 Locale Bestanden Structuur

```
src/i18n/locales/
├── nl.json          # Nederlands
├── en.json          # Engels
└── ar.json          # Arabisch
```

### Voorbeeld Key Structuur:
```json
{
  "common": {
    "hello": "Hallo",
    "welcome": "Welkom"
  },
  "curriculum": {
    "level_1": "Basis",
    "level_2": "Beginner"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "lessons": "Lessen"
  }
}
```

## 🔄 Vertaalproces

### Voor Nieuwe Features:

1. **Developer**:
   - Voegt keys toe aan `nl.json`
   - Markeert ontbrekende vertalingen met `[TODO]`
   - Commit naar feature branch

2. **Terminology Specialist**:
   - Controleert nieuwe termen
   - Voegt toe aan terminologielijst
   - Zorgt voor consistentie

3. **Vertalers**:
   - EN: Vertaalt Nederlands → Engels
   - AR: Vertaalt Nederlands → Arabisch
   - Review door native speakers

4. **QA**:
   - Automated check voor ontbrekende keys
   - Manual review in alle talen
   - RTL layout check voor Arabisch

## 🛠️ Tools & Scripts

### Automated Key Checking
```bash
npm run i18n:check
```
Controleert op:
- Ontbrekende keys
- Unused keys
- Inconsistent formatting

### Extract Keys
```bash
npm run i18n:extract
```
Haalt alle gebruikte keys uit de codebase.

### Generate Reports
```bash
npm run i18n:report
```
Genereert coverage rapport per taal.

## 📊 Coverage Status

| Taal | Status | Percentage | Laatste Update |
|------|--------|------------|----------------|
| 🇳🇱 NL | ✅ | 100% | 24 nov 2025 |
| 🇬🇧 EN | ✅ | 100% | 24 nov 2025 |
| 🇸🇦 AR | 🟡 | 95% | 24 nov 2025 |

## 🎨 RTL Design Guidelines

### Layout Mirroring
```css
/* Auto-mirror for RTL */
[dir="rtl"] {
  .container {
    direction: rtl;
  }
  
  .icon-left {
    transform: scaleX(-1);
  }
}
```

### Text Alignment
```tsx
<p className="text-start"> {/* Not text-left! */}
  {t('content.paragraph')}
</p>
```

### Navigation
```tsx
// Carousel in RTL should go right to left
<Carousel dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

## 🌐 Fallback Strategy

1. **Primary**: Gebruiker's gekozen taal
2. **Secondary**: Browser voorkeurstaal
3. **Fallback**: Nederlands (altijd compleet)

## 📝 Style Guide

### Tone of Voice

**Nederlands**: Vriendelijk en direct
```
"Begin je eerste les"
```

**Engels**: Professional en encouraging
```
"Start your first lesson"
```

**Arabisch**: Respectvol en formeel
```
"ابدأ درسك الأول"
```

### Formality Level

| Context | NL | EN | AR |
|---------|----|----|-----|
| UI Buttons | Informeel (je) | Neutral (you) | Formeel (أنت) |
| Instructions | Semi-formeel | Professional | Zeer formeel |
| Feedback | Positief | Encouraging | Respectvol |

## 🔍 Quality Checklist

Voor elke vertaling:
- [ ] Correct grammatica
- [ ] Cultureel appropriate
- [ ] Consistent met terminologie
- [ ] Tested in UI (geen overflow)
- [ ] RTL layout correct (AR)
- [ ] No hardcoded strings
- [ ] Pluralization correct
- [ ] Date/number formatting locale-aware

## 📚 Resources

- [Translation Workflow](./vertaalworkflow.md) - Volledige proces
- [Terminology Database](./terminologie.md) - Alle vaste termen
- [RTL Implementation](./rtl-support.md) - Technische details
- [i18next Documentation](https://www.i18next.com/) - Library docs

## 🆘 Support

**Vragen over vertalingen?**
- Terminology Specialist: Check terminologielijst eerst
- Technical Issues: Raadpleeg RTL support docs
- Missing Translations: Run `npm run i18n:check`

---

**Laatst bijgewerkt:** 25 november 2025  
**Versie:** 1.0
