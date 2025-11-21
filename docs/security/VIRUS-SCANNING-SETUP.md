# 🛡️ Virus Scanning Setup Guide

## Overzicht

Het platform ondersteunt drie niveaus van virus scanning:
1. **Pattern Matching** (Basis) - ✅ Actief
2. **ClamAV** (Lokaal) - 📋 Optioneel
3. **VirusTotal** (Cloud) - 📋 Optioneel

## 1. Pattern Matching (Standaard)

✅ **Status:** Actief en werkend

- Detecteert bekende malware patronen
- Gratis en geen setup nodig
- Beperkt tot tekstuele patronen
- Zie: `supabase/functions/scan-upload/index.ts`

## 2. ClamAV Setup (Aanbevolen voor Productie)

### Via Docker (Eenvoudigst)

```bash
docker run -d --name clamav -p 3310:3310 clamav/clamav:latest
```

### Integratie in Edge Function

```typescript
import { ClamAVScanner } from './clamav-integration.ts'

const scanner = new ClamAVScanner({
  host: 'localhost',
  port: 3310
});

const result = await scanner.scanFile(fileBuffer);
```

### Kosten
- **Gratis** en open source
- Lokaal draaien, geen API costs

## 3. VirusTotal API Setup

### 1. API Key Verkrijgen
1. Ga naar https://www.virustotal.com
2. Maak gratis account
3. Genereer API key
4. Voeg toe als Supabase secret: `VIRUSTOTAL_API_KEY`

### 2. Integratie

```typescript
import { VirusTotalScanner } from './virustotal-integration.ts'

const scanner = new VirusTotalScanner();
const result = await scanner.scanFile(fileBuffer, fileName);
```

### Rate Limits
- **Gratis:** 4 req/min, 500/dag
- **Premium:** Hogere limits

## Testing

```bash
# Test ClamAV verbinding
deno test supabase/functions/scan-upload/clamav-integration.ts

# Test VirusTotal verbinding  
deno test supabase/functions/scan-upload/virustotal-integration.ts
```

## Productie Aanbevelingen

1. **Primair:** ClamAV voor snelle, lokale scans
2. **Secundair:** VirusTotal voor verdachte bestanden
3. **Fallback:** Pattern matching

## Monitoring

Alle scans worden gelogd in `file_scans` tabel met:
- Scan status
- Detectie details
- Timestamp
- Scanner type
