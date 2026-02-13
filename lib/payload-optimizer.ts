/**
 * Payload Optimizer
 * Handles large payloads to prevent 413 errors from Cloudflare/CDN
 */

const CLOUDFLARE_SIZE_LIMIT = 95 * 1024 * 1024; // 95MB (safe margin under 100MB limit)
const WARNING_SIZE_THRESHOLD = 50 * 1024 * 1024; // 50MB warning threshold
const CHUNK_SIZE = 40 * 1024 * 1024; // 40MB per chunk

export interface PayloadSizeInfo {
  bytes: number;
  megabytes: number;
  isLarge: boolean;
  exceedsLimit: boolean;
}

/**
 * Calculate the size of a JSON payload in bytes
 */
export function calculatePayloadSize(data: any): PayloadSizeInfo {
  const jsonString = JSON.stringify(data);
  const bytes = new Blob([jsonString]).size;
  const megabytes = bytes / (1024 * 1024);

  return {
    bytes,
    megabytes: parseFloat(megabytes.toFixed(2)),
    isLarge: bytes > WARNING_SIZE_THRESHOLD,
    exceedsLimit: bytes > CLOUDFLARE_SIZE_LIMIT,
  };
}

/**
 * Compress large text content by removing unnecessary whitespace
 */
export function compressContent(content: any): any {
  if (typeof content === 'string') {
    return content
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  if (Array.isArray(content)) {
    return content.map(compressContent);
  }

  if (typeof content === 'object' && content !== null) {
    const compressed: any = {};
    for (const [key, value] of Object.entries(content)) {
      compressed[key] = compressContent(value);
    }
    return compressed;
  }

  return content;
}

/**
 * Check if content contains base64 images
 */
export function hasBase64Images(content: any): boolean {
  const contentStr = JSON.stringify(content);
  return /data:image\/[^;]+;base64,/.test(contentStr);
}

/**
 * Extract base64 images from content
 */
export function extractBase64Images(content: string): string[] {
  const base64Pattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
  return content.match(base64Pattern) || [];
}

/**
 * Get recommendations for reducing payload size
 */
export function getOptimizationSuggestions(sizeInfo: PayloadSizeInfo, content: any): string[] {
  const suggestions: string[] = [];

  if (hasBase64Images(content)) {
    suggestions.push('Upload images to Supabase Storage instead of embedding them as base64');
  }

  if (sizeInfo.megabytes > 10) {
    suggestions.push('Consider splitting content into multiple smaller sections');
    suggestions.push('Remove unnecessary formatting and whitespace');
  }

  if (typeof content === 'object') {
    const keys = Object.keys(content);
    if (keys.length > 50) {
      suggestions.push('Reduce the number of fields in your content structure');
    }
  }

  return suggestions;
}

/**
 * Split large content into chunks for sequential updates
 */
export function chunkContent(content: Record<string, any>): Array<Record<string, any>> {
  const entries = Object.entries(content);
  const chunks: Array<Record<string, any>> = [];

  let currentChunk: Record<string, any> = {};
  let currentSize = 0;

  for (const [key, value] of entries) {
    const entrySize = new Blob([JSON.stringify({ [key]: value })]).size;

    if (currentSize + entrySize > CHUNK_SIZE && Object.keys(currentChunk).length > 0) {
      chunks.push(currentChunk);
      currentChunk = {};
      currentSize = 0;
    }

    currentChunk[key] = value;
    currentSize += entrySize;
  }

  if (Object.keys(currentChunk).length > 0) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [content];
}

/**
 * Validate payload before sending to Supabase
 */
export function validatePayload(data: any): {
  valid: boolean;
  sizeInfo: PayloadSizeInfo;
  suggestions: string[];
  error?: string;
} {
  const sizeInfo = calculatePayloadSize(data);
  const suggestions = getOptimizationSuggestions(sizeInfo, data);

  if (sizeInfo.exceedsLimit) {
    return {
      valid: false,
      sizeInfo,
      suggestions,
      error: `Payload size (${sizeInfo.megabytes}MB) exceeds the maximum allowed size. Please reduce content size or split into smaller updates.`,
    };
  }

  return {
    valid: true,
    sizeInfo,
    suggestions: sizeInfo.isLarge ? suggestions : [],
  };
}

/**
 * Optimize content before saving
 */
export function optimizeForSave(content: any): {
  optimized: any;
  compressionRatio: number;
  originalSize: number;
  optimizedSize: number;
} {
  const originalSize = calculatePayloadSize(content).bytes;
  const optimized = compressContent(content);
  const optimizedSize = calculatePayloadSize(optimized).bytes;
  const compressionRatio = originalSize > 0 ? optimizedSize / originalSize : 1;

  return {
    optimized,
    compressionRatio: parseFloat(compressionRatio.toFixed(2)),
    originalSize,
    optimizedSize,
  };
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
