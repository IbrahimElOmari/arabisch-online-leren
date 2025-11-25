import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'
import { corsHeaders } from '../_shared/cors.ts'
import { ClamAVScanner } from './clamav-integration.ts'
import { VirusTotalScanner } from './virustotal-integration.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { filePath, fileSize, fileType, uploadedBy, storageBucket } = await req.json()

    if (!filePath || !fileSize || !fileType || !uploadedBy || !storageBucket) {
      throw new Error('Missing required parameters')
    }

    console.log(`Scanning file: ${filePath} for user: ${uploadedBy}`)

    // Create file scan record
    const { data: scanRecord, error: scanError } = await supabase
      .from('file_scans')
      .insert({
        file_path: filePath,
        file_size: fileSize,
        file_type: fileType,
        uploaded_by: uploadedBy,
        storage_bucket: storageBucket,
        scan_status: 'scanning'
      })
      .select()
      .single()

    if (scanError) {
      console.error('Failed to create scan record:', scanError)
      throw scanError
    }

    // Perform virus scan with ClamAV or VirusTotal (fallback to pattern matching)
    const scanResult = await performVirusScan(filePath, storageBucket, supabase)

    // Update scan record with results
    const { error: updateError } = await supabase
      .from('file_scans')
      .update({
        scan_status: scanResult.status,
        scan_result: scanResult,
        scanned_at: new Date().toISOString(),
        quarantined: scanResult.status === 'infected'
      })
      .eq('id', scanRecord.id)

    if (updateError) {
      console.error('Failed to update scan record:', updateError)
      throw updateError
    }

    // If infected, move to quarantine
    if (scanResult.status === 'infected') {
      console.warn(`⚠️ Infected file detected: ${filePath}`)
      
      // Delete the infected file from storage
      const { error: deleteError } = await supabase.storage
        .from(storageBucket)
        .remove([filePath])

      if (deleteError) {
        console.error('Failed to quarantine infected file:', deleteError)
      }

      return new Response(
        JSON.stringify({
          success: false,
          scanId: scanRecord.id,
          status: 'infected',
          message: 'File is infected and has been quarantined',
          details: scanResult
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`✅ File scan completed successfully: ${filePath}`)

    return new Response(
      JSON.stringify({
        success: true,
        scanId: scanRecord.id,
        status: scanResult.status,
        message: 'File scan completed successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in scan-upload function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Performs virus scanning on uploaded files with cascade fallback:
 * 1. VirusTotal API (if key available)
 * 2. ClamAV (if host configured)
 * 3. Pattern matching (fallback)
 */
async function performVirusScan(
  filePath: string,
  storageBucket: string,
  supabase: any
): Promise<{ status: 'clean' | 'infected' | 'error'; details?: any }> {
  try {
    // Get file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(storageBucket)
      .download(filePath)

    if (downloadError) {
      console.error('Failed to download file for scanning:', downloadError)
      return {
        status: 'error',
        details: { error: 'Failed to download file', message: downloadError.message }
      }
    }

    const fileBuffer = await fileData.arrayBuffer()
    const fileSizeInMB = fileBuffer.byteLength / (1024 * 1024)
    
    // File size check (files over 100MB are rejected)
    if (fileSizeInMB > 100) {
      console.warn(`⚠️ File too large: ${fileSizeInMB}MB`)
      return {
        status: 'infected',
        details: {
          reason: 'file_too_large',
          size: fileSizeInMB,
          scanner: 'size-check',
          timestamp: new Date().toISOString()
        }
      }
    }

    const fileName = filePath.split('/').pop() || 'unknown'

    // TIER 1: Try VirusTotal API (best coverage, cloud-based)
    const virusTotalKey = Deno.env.get('VIRUSTOTAL_API_KEY')
    if (virusTotalKey) {
      try {
        console.log('🔍 Scanning with VirusTotal API...')
        const vtScanner = new VirusTotalScanner(virusTotalKey)
        const vtResult = await vtScanner.scanFile(fileBuffer, fileName)
        
        if (vtResult.status !== 'error') {
          console.log(`✅ VirusTotal scan complete: ${vtResult.status}`)
          return vtResult
        }
        
        console.warn('⚠️ VirusTotal scan failed, falling back to ClamAV')
      } catch (vtError) {
        console.error('VirusTotal error:', vtError)
        console.log('Falling back to ClamAV...')
      }
    }

    // TIER 2: Try ClamAV (local/container-based scanning)
    const clamavHost = Deno.env.get('CLAMAV_HOST')
    const clamavPort = Deno.env.get('CLAMAV_PORT')
    
    if (clamavHost) {
      try {
        console.log('🔍 Scanning with ClamAV...')
        const clamScanner = new ClamAVScanner({
          host: clamavHost,
          port: clamavPort ? parseInt(clamavPort) : 3310
        })
        
        const clamResult = await clamScanner.scanFile(fileBuffer)
        
        if (clamResult.status !== 'error') {
          console.log(`✅ ClamAV scan complete: ${clamResult.status}`)
          return clamResult
        }
        
        console.warn('⚠️ ClamAV scan failed, falling back to pattern matching')
      } catch (clamError) {
        console.error('ClamAV error:', clamError)
        console.log('Falling back to pattern matching...')
      }
    }

    // TIER 3: Pattern matching fallback (basic protection)
    console.log('🔍 Using pattern matching (fallback mode)...')
    
    const textDecoder = new TextDecoder('utf-8', { fatal: false })
    const textContent = textDecoder.decode(fileBuffer).toLowerCase()
    
    // Common malicious patterns
    const maliciousPatterns = [
      '<script>alert(',
      '<script>prompt(',
      '<script>confirm(',
      'eval(',
      'document.write(',
      'window.location',
      'onerror=',
      'onload=',
      'onclick=',
      'javascript:',
      'data:text/html',
      '<?php',
      'exec(',
      'system(',
      'shell_exec(',
      'passthru(',
      'base64_decode(',
      'gzinflate(',
      'str_rot13(',
      'eval(base64_decode'
    ]

    for (const pattern of maliciousPatterns) {
      if (textContent.includes(pattern)) {
        console.warn(`⚠️ Detected malicious pattern: ${pattern}`)
        return {
          status: 'infected',
          details: {
            detectedPattern: pattern,
            scanner: 'pattern-matching-fallback',
            timestamp: new Date().toISOString(),
            warning: 'Basic pattern matching only - consider enabling ClamAV or VirusTotal'
          }
        }
      }
    }

    console.log(`✅ File passed security checks (pattern matching): ${filePath}`)

    return {
      status: 'clean',
      details: {
        scanner: 'pattern-matching-fallback',
        timestamp: new Date().toISOString(),
        fileSize: fileBuffer.byteLength,
        warning: 'Using basic scanning - for production, enable VirusTotal or ClamAV'
      }
    }

  } catch (error) {
    console.error('Error during virus scan:', error)
    return {
      status: 'error',
      details: { error: 'Scan failed', message: error.message }
    }
  }
}
