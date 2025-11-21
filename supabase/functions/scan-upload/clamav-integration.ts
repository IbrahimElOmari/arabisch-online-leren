/**
 * ✅ ClamAV Integration voor Virus Scanning
 * 
 * Deze module integreert ClamAV voor professionele virus scanning.
 * Voor productie-gebruik moet je een ClamAV daemon draaien.
 * 
 * Installatie via Docker:
 * docker run -d --name clamav -p 3310:3310 clamav/clamav
 * 
 * Of gebruik VirusTotal API als alternatief (zie virustotal-integration.ts)
 */

interface ClamAVConfig {
  host: string;
  port: number;
  timeout: number; // in milliseconds
}

interface ScanResult {
  status: 'clean' | 'infected' | 'error';
  details: {
    scanner: string;
    virus?: string;
    timestamp: string;
    error?: string;
  };
}

export class ClamAVScanner {
  private config: ClamAVConfig;

  constructor(config?: Partial<ClamAVConfig>) {
    this.config = {
      host: config?.host || Deno.env.get('CLAMAV_HOST') || 'localhost',
      port: config?.port || Number(Deno.env.get('CLAMAV_PORT')) || 3310,
      timeout: config?.timeout || 60000, // 60 seconds
    };
  }

  /**
   * Scan een bestand met ClamAV
   */
  async scanFile(fileBuffer: ArrayBuffer): Promise<ScanResult> {
    try {
      console.log(`🔍 Scanning file with ClamAV at ${this.config.host}:${this.config.port}`);

      // Connect to ClamAV daemon
      const conn = await this.connectToClamAV();

      // Send INSTREAM command
      await this.writeToSocket(conn, 'zINSTREAM\0');

      // Send file in chunks
      await this.sendFileInChunks(conn, fileBuffer);

      // Send end-of-stream marker (0-length chunk)
      await this.writeToSocket(conn, new Uint8Array([0, 0, 0, 0]));

      // Read response
      const response = await this.readResponse(conn);
      conn.close();

      // Parse ClamAV response
      return this.parseClamAVResponse(response);

    } catch (error) {
      console.error('❌ ClamAV scan failed:', error);
      return {
        status: 'error',
        details: {
          scanner: 'clamav',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Verbind met ClamAV daemon via TCP
   */
  private async connectToClamAV(): Promise<Deno.Conn> {
    try {
      const conn = await Deno.connect({
        hostname: this.config.host,
        port: this.config.port,
      });

      return conn;
    } catch (error) {
      throw new Error(`Failed to connect to ClamAV: ${error.message}`);
    }
  }

  /**
   * Schrijf data naar socket
   */
  private async writeToSocket(conn: Deno.Conn, data: string | Uint8Array): Promise<void> {
    const bytes = typeof data === 'string' 
      ? new TextEncoder().encode(data)
      : data;
    
    await conn.write(bytes);
  }

  /**
   * Stuur bestand in chunks naar ClamAV
   */
  private async sendFileInChunks(conn: Deno.Conn, fileBuffer: ArrayBuffer): Promise<void> {
    const CHUNK_SIZE = 2048; // 2KB chunks
    const uint8Array = new Uint8Array(fileBuffer);
    
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
      const chunk = uint8Array.slice(i, Math.min(i + CHUNK_SIZE, uint8Array.length));
      
      // Send chunk size (4 bytes, network byte order)
      const sizeBuffer = new ArrayBuffer(4);
      const sizeView = new DataView(sizeBuffer);
      sizeView.setUint32(0, chunk.length, false); // Big-endian
      
      await conn.write(new Uint8Array(sizeBuffer));
      await conn.write(chunk);
    }
  }

  /**
   * Lees response van ClamAV
   */
  private async readResponse(conn: Deno.Conn): Promise<string> {
    const buffer = new Uint8Array(1024);
    const n = await conn.read(buffer);
    
    if (!n) {
      throw new Error('No response from ClamAV');
    }

    const response = new TextDecoder().decode(buffer.subarray(0, n));
    return response;
  }

  /**
   * Parse ClamAV response
   */
  private parseClamAVResponse(response: string): ScanResult {
    console.log('📊 ClamAV Response:', response);

    // ClamAV responses:
    // "stream: OK\0" = clean
    // "stream: <virus name> FOUND\0" = infected
    // "stream: <error> ERROR\0" = error

    if (response.includes('OK')) {
      return {
        status: 'clean',
        details: {
          scanner: 'clamav',
          timestamp: new Date().toISOString(),
        },
      };
    }

    if (response.includes('FOUND')) {
      const virusMatch = response.match(/stream: (.+) FOUND/);
      const virusName = virusMatch ? virusMatch[1] : 'Unknown virus';
      
      return {
        status: 'infected',
        details: {
          scanner: 'clamav',
          virus: virusName,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      status: 'error',
      details: {
        scanner: 'clamav',
        error: response,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Test de verbinding met ClamAV
   */
  async ping(): Promise<boolean> {
    try {
      const conn = await this.connectToClamAV();
      await this.writeToSocket(conn, 'zPING\0');
      const response = await this.readResponse(conn);
      conn.close();
      
      return response.includes('PONG');
    } catch (error) {
      console.error('❌ ClamAV ping failed:', error);
      return false;
    }
  }

  /**
   * Haal ClamAV versie op
   */
  async version(): Promise<string | null> {
    try {
      const conn = await this.connectToClamAV();
      await this.writeToSocket(conn, 'zVERSION\0');
      const response = await this.readResponse(conn);
      conn.close();
      
      return response.trim();
    } catch (error) {
      console.error('❌ ClamAV version check failed:', error);
      return null;
    }
  }
}
