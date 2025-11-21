/**
 * ✅ VirusTotal API Integration voor Virus Scanning
 * 
 * Deze module integreert de VirusTotal API v3 voor cloud-based virus scanning.
 * 
 * Setup:
 * 1. Maak een account op https://www.virustotal.com/
 * 2. Genereer een API key
 * 3. Voeg de key toe als VIRUSTOTAL_API_KEY secret in Supabase
 * 
 * Note: VirusTotal API heeft rate limits:
 * - Gratis: 4 requests/minute, 500 requests/dag
 * - Premium: hogere limits
 */

interface VirusTotalConfig {
  apiKey: string;
  baseUrl: string;
}

interface ScanResult {
  status: 'clean' | 'infected' | 'suspicious' | 'error' | 'pending';
  details: {
    scanner: string;
    virus?: string;
    positives?: number;
    total?: number;
    scanners?: Record<string, any>;
    timestamp: string;
    error?: string;
    scanId?: string;
  };
}

export class VirusTotalScanner {
  private config: VirusTotalConfig;

  constructor(apiKey?: string) {
    this.config = {
      apiKey: apiKey || Deno.env.get('VIRUSTOTAL_API_KEY') || '',
      baseUrl: 'https://www.virustotal.com/api/v3',
    };

    if (!this.config.apiKey) {
      throw new Error('VirusTotal API key is required');
    }
  }

  /**
   * Scan een bestand met VirusTotal
   */
  async scanFile(fileBuffer: ArrayBuffer, fileName: string): Promise<ScanResult> {
    try {
      console.log(`🔍 Scanning file with VirusTotal: ${fileName}`);

      // Upload file voor scanning
      const scanId = await this.uploadFile(fileBuffer, fileName);

      // Wait en haal resultaten op
      const result = await this.getScanResults(scanId);

      return result;

    } catch (error) {
      console.error('❌ VirusTotal scan failed:', error);
      return {
        status: 'error',
        details: {
          scanner: 'virustotal',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Upload bestand naar VirusTotal
   */
  private async uploadFile(fileBuffer: ArrayBuffer, fileName: string): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, fileName);

    const response = await fetch(`${this.config.baseUrl}/files`, {
      method: 'POST',
      headers: {
        'x-apikey': this.config.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VirusTotal upload failed: ${error}`);
    }

    const data = await response.json();
    return data.data.id; // Scan ID
  }

  /**
   * Haal scan resultaten op
   */
  private async getScanResults(scanId: string, maxRetries = 10): Promise<ScanResult> {
    let retries = 0;

    while (retries < maxRetries) {
      const response = await fetch(`${this.config.baseUrl}/analyses/${scanId}`, {
        headers: {
          'x-apikey': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get scan results: ${response.statusText}`);
      }

      const data = await response.json();
      const status = data.data.attributes.status;

      if (status === 'completed') {
        return this.parseVirusTotalResults(data);
      }

      // Wacht 5 seconden voor volgende poging
      await new Promise(resolve => setTimeout(resolve, 5000));
      retries++;
    }

    // Timeout - return pending status
    return {
      status: 'pending',
      details: {
        scanner: 'virustotal',
        scanId: scanId,
        timestamp: new Date().toISOString(),
        error: 'Scan timeout - check results manually',
      },
    };
  }

  /**
   * Parse VirusTotal resultaten
   */
  private parseVirusTotalResults(data: any): ScanResult {
    const stats = data.data.attributes.stats;
    const results = data.data.attributes.results;

    const positives = stats.malicious || 0;
    const total = Object.keys(results).length;

    console.log(`📊 VirusTotal Results: ${positives}/${total} scanners detected threats`);

    // Bepaal status
    let status: 'clean' | 'infected' | 'suspicious' = 'clean';
    if (positives > 0) {
      status = positives >= 3 ? 'infected' : 'suspicious';
    }

    // Vind virus namen
    const virusNames = Object.entries(results)
      .filter(([_, result]: [string, any]) => result.category === 'malicious')
      .map(([scanner, result]: [string, any]) => `${scanner}: ${result.result}`)
      .slice(0, 5); // Toon eerste 5

    return {
      status,
      details: {
        scanner: 'virustotal',
        positives,
        total,
        virus: virusNames.length > 0 ? virusNames.join(', ') : undefined,
        scanners: results,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Scan bestand via hash (SHA256)
   */
  async scanFileHash(fileHash: string): Promise<ScanResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/files/${fileHash}`, {
        headers: {
          'x-apikey': this.config.apiKey,
        },
      });

      if (response.status === 404) {
        return {
          status: 'error',
          details: {
            scanner: 'virustotal',
            error: 'File not found in VirusTotal database',
            timestamp: new Date().toISOString(),
          },
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to get file info: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseVirusTotalResults({ data });

    } catch (error) {
      console.error('❌ VirusTotal hash scan failed:', error);
      return {
        status: 'error',
        details: {
          scanner: 'virustotal',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Test API verbinding
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/users/current`, {
        headers: {
          'x-apikey': this.config.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ VirusTotal ping failed:', error);
      return false;
    }
  }
}

/**
 * Helper functie om SHA256 hash te berekenen
 */
export async function calculateSHA256(fileBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
