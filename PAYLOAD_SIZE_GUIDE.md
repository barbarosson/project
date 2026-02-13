# Payload Size Optimization Guide

## Overview

This guide explains the 413 Payload Too Large error and how the application handles it.

## Problem: 413 Payload Too Large

### What Causes This Error?

The 413 error occurs when the data you're trying to send exceeds the server or CDN limits:

1. **Cloudflare Limits:**
   - Free tier: 100MB request size limit
   - Pro/Business: 100-500MB depending on plan
   - Default API POST/PUT limit: 100MB

2. **Common Causes in CMS:**
   - Base64-encoded images embedded in content
   - Very large rich text content
   - Saving multiple large sections simultaneously
   - Unoptimized JSON payloads

3. **Size Contributors:**
   - Base64 image (1MB) = ~1.37MB in JSON
   - Rich text with formatting adds significant overhead
   - Multiple sections saved together multiply the size

## Solution Implemented

### Automatic Payload Optimization

The application now automatically:

1. **Validates** payloads before sending
2. **Optimizes** content by removing unnecessary whitespace
3. **Warns** users about large content
4. **Prevents** saves that will fail
5. **Provides** helpful error messages and suggestions

### How It Works

#### 1. Payload Validation

Before saving, the system checks:

```typescript
// Validates size and provides suggestions
const validation = validatePayload(content);

if (!validation.valid) {
  // Shows error with specific recommendations
  toast.error(validation.error);
  toast.info('Suggestion: ' + validation.suggestions[0]);
}
```

#### 2. Content Optimization

Automatically optimizes content:

```typescript
// Removes unnecessary whitespace and formatting
const optimized = optimizeForSave(content);

// Shows compression results
console.log(`Original: ${formatBytes(originalSize)}`);
console.log(`Optimized: ${formatBytes(optimizedSize)}`);
```

#### 3. Smart Error Handling

Detects and handles 413 errors:

```typescript
if (error.message?.includes('413')) {
  toast.error('Content too large. Please reduce content size.');
  // Rollback to previous state
}
```

## Best Practices

### 1. Use External Image URLs

**DO:**
```html
<img src="https://your-storage.supabase.co/bucket/image.jpg" />
```

**DON'T:**
```html
<img src="data:image/jpeg;base64,/9j/4AAQSkZJRg..." />
```

**Why:**
- Base64 images are 37% larger than binary
- They're included in every API request
- They can't be cached effectively
- They make JSON parsing slower

### 2. Upload Images to Supabase Storage

Instead of embedding images:

1. Upload to Supabase Storage bucket
2. Get public URL
3. Use URL in content

```typescript
// Upload image
const { data, error } = await supabase.storage
  .from('cms-assets')
  .upload('images/my-image.jpg', file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('cms-assets')
  .getPublicUrl('images/my-image.jpg');

// Use in content
editor.chain().focus().setImage({ src: publicUrl }).run();
```

### 3. Keep Sections Focused

Split large content into multiple sections:

**Good:**
- Hero Section: 50KB
- Features Section: 75KB
- Testimonials Section: 40KB
- Total: 165KB across 3 saves

**Bad:**
- Single Page: 165KB in one save
- Higher risk of hitting limits
- Slower to load and edit

### 4. Optimize Rich Text Content

- Remove unnecessary formatting
- Use CSS classes instead of inline styles
- Minimize nested HTML structures
- Remove empty paragraphs and divs

### 5. Monitor Content Size

The system shows warnings for large content:

```
⚠️ Large content detected (52.3MB). Optimizing...
```

If you see this warning frequently:
- Consider splitting content
- Review for base64 images
- Remove unused formatting

## Size Limits

### Application Limits

```typescript
// Cloudflare/CDN limit
Maximum Size: 95MB (safe margin under 100MB)

// Warning threshold
Warning at: 50MB

// Chunk size for large operations
Chunk Size: 40MB per operation
```

### Recommendations by Content Type

| Content Type | Recommended Size | Max Size |
|--------------|-----------------|----------|
| Text Section | < 1MB | 5MB |
| Rich Text with Images (URLs) | < 5MB | 20MB |
| Complex Layout | < 10MB | 40MB |
| Full Page (all sections) | < 20MB | 80MB |

## Error Messages

### "Content is too large to save"

**Cause:** Payload exceeds 95MB limit

**Solutions:**
1. Split content into smaller sections
2. Remove base64 images
3. Upload images to storage
4. Reduce content size

### "Large content detected (X MB). Optimizing..."

**Cause:** Content is large but within limits

**Action:** Content will be automatically optimized

**Prevention:**
- Use image URLs instead of base64
- Keep sections focused
- Remove unnecessary formatting

### "Upload images to Supabase Storage"

**Cause:** Base64 images detected in content

**Solution:**
1. Save images separately to Supabase Storage
2. Replace base64 with storage URLs
3. Re-save content

## TipTap Editor Warnings

When adding images, the editor warns about base64:

```
Warning: Base64 images are not recommended!

Base64 images significantly increase content size and may cause save failures.
Please upload images to Supabase Storage and use the public URL instead.
```

**Always use image URLs, not base64 data.**

## Monitoring and Debugging

### Developer Console Logs

The system logs detailed information:

```javascript
// Payload validation
✅ Payload valid: 2.5MB

// Large payload warning
⚠️ Large payload detected: 52.3MB

// Optimization results
✅ Content optimized:
   Original: 125.5 MB
   Optimized: 98.2 MB
   Ratio: 0.78

// Save errors
❌ Section update error: Payload too large
```

### Check Payload Size

In browser console:

```javascript
import { calculatePayloadSize, formatBytes } from '@/lib/payload-optimizer';

const content = yourContent;
const size = calculatePayloadSize(content);

console.log(`Size: ${formatBytes(size.bytes)}`);
console.log(`Large: ${size.isLarge}`);
console.log(`Exceeds limit: ${size.exceedsLimit}`);
```

## Troubleshooting

### Problem: Saves Keep Failing

1. **Check for Base64 Images:**
   ```javascript
   // In console
   const hasBase64 = /data:image/.test(JSON.stringify(content));
   console.log('Has base64:', hasBase64);
   ```

2. **Measure Content Size:**
   ```javascript
   const size = new Blob([JSON.stringify(content)]).size;
   console.log('Size:', (size / 1024 / 1024).toFixed(2), 'MB');
   ```

3. **Split Content:**
   - Create multiple smaller sections
   - Save each section individually
   - Keep each under 40MB

### Problem: Content Gets Corrupted

**Cause:** Over-optimization removing important whitespace

**Solution:**
- The optimizer preserves semantic whitespace
- If issues occur, the original is rolled back
- Check the rollback in section forms

### Problem: Slow Saves

**Cause:** Large content takes longer to:
- Serialize to JSON
- Compress/optimize
- Send over network
- Process on server

**Solutions:**
1. Split into smaller sections
2. Save sections individually (not "Save All")
3. Use external storage for assets
4. Optimize before editing

## API Reference

### `validatePayload(data)`

Validates content before saving.

```typescript
const validation = validatePayload(content);

validation.valid        // boolean: can be saved
validation.sizeInfo     // size information
validation.suggestions  // optimization tips
validation.error        // error message if invalid
```

### `optimizeForSave(content)`

Optimizes content for storage.

```typescript
const result = optimizeForSave(content);

result.optimized          // optimized content
result.compressionRatio   // compression achieved
result.originalSize       // original size in bytes
result.optimizedSize      // new size in bytes
```

### `calculatePayloadSize(data)`

Calculate size of any data.

```typescript
const size = calculatePayloadSize(content);

size.bytes          // size in bytes
size.megabytes      // size in MB
size.isLarge        // true if > 50MB
size.exceedsLimit   // true if > 95MB
```

### `formatBytes(bytes)`

Format bytes to human-readable string.

```typescript
formatBytes(1024)           // "1 KB"
formatBytes(1048576)        // "1 MB"
formatBytes(1073741824)     // "1 GB"
```

## Migration Guide

### Existing Content with Base64 Images

If you have existing content with base64 images:

1. **Extract Images:**
   ```typescript
   import { extractBase64Images } from '@/lib/payload-optimizer';

   const images = extractBase64Images(content);
   console.log(`Found ${images.length} base64 images`);
   ```

2. **Upload to Storage:**
   ```typescript
   for (const base64 of images) {
     // Convert base64 to blob
     const blob = await fetch(base64).then(r => r.blob());

     // Upload to Supabase
     const fileName = `image-${Date.now()}.jpg`;
     await supabase.storage
       .from('cms-assets')
       .upload(fileName, blob);
   }
   ```

3. **Replace in Content:**
   ```typescript
   let newContent = content;
   images.forEach((base64, index) => {
     const url = storageUrls[index];
     newContent = newContent.replace(base64, url);
   });
   ```

### Batch Migration Script

For migrating all existing content:

```typescript
async function migrateContent() {
  // Get all sections
  const { data: sections } = await supabase
    .from('cms_page_sections')
    .select('*');

  for (const section of sections) {
    const validation = validatePayload(section.content_json);

    if (!validation.valid || validation.sizeInfo.isLarge) {
      console.log(`Section ${section.id} needs optimization`);

      // Extract and upload base64 images
      // Replace with storage URLs
      // Save optimized content
    }
  }
}
```

## Performance Tips

1. **Save Frequently:** Small saves are faster and more reliable
2. **Use External URLs:** For all media and assets
3. **Minimize Formatting:** Use CSS classes instead of inline styles
4. **Test Large Changes:** Save one section first before "Save All"
5. **Monitor Warnings:** Address size warnings promptly

## Support

If you continue experiencing 413 errors after following this guide:

1. Check the browser console for specific error details
2. Measure your content size using the tools above
3. Review for base64 images and large sections
4. Consider architectural changes for very large sites

## Summary

**Key Takeaways:**
- Always use image URLs, never base64
- Keep sections under 40MB each
- Monitor size warnings in the UI
- Use Supabase Storage for all media
- Split large content into focused sections
- The system automatically optimizes content
- Validation prevents failed saves before they happen
