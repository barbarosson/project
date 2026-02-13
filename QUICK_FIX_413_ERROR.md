# Quick Fix: 413 Payload Too Large Error

## Immediate Solutions

### If You See This Error

```
413 Payload Too Large
```

**Try these fixes in order:**

### 1. Remove Base64 Images (Most Common)

**Problem:** Embedded base64 images make content huge.

**Fix:**
1. Don't paste images directly into the editor
2. Upload images to Supabase Storage first
3. Use the image URL instead

**Example:**
```
DON'T: data:image/jpeg;base64,/9j/4AAQ...
DO: https://your-storage.supabase.co/bucket/image.jpg
```

### 2. Split Large Sections

**Problem:** Too much content in one section.

**Fix:**
1. Divide content into multiple focused sections
2. Save each section individually
3. Use "Save Section" instead of "Save All"

**Example:**
```
Instead of:
- One huge "Content" section (100MB)

Split into:
- Hero Section (5MB)
- Features Section (8MB)
- Testimonials Section (3MB)
```

### 3. Reduce Content Size

**Problem:** Very long text or complex formatting.

**Fix:**
1. Remove unnecessary formatting
2. Simplify HTML structure
3. Use external links for large content
4. Consider pagination

### 4. Save Individually

**Problem:** Saving multiple sections at once.

**Fix:**
- Use "Save Section" button for each section
- Avoid "Save All Changes" for large pages
- Save after each major edit

## Prevention

### Always Use Image URLs

When the editor asks for an image:
```
Enter image URL:

NOTE: Use Supabase Storage URLs or external image URLs.
DO NOT use base64-encoded images.
```

**How to Upload Images:**

1. Go to Supabase Dashboard → Storage
2. Upload image to bucket
3. Copy public URL
4. Paste URL in editor

### Monitor Size Warnings

Watch for these warnings:
```
⚠️ Large content detected (52MB). Optimizing...
```

**Action:** Consider splitting the section.

### Keep Sections Focused

**Good Section Sizes:**
- Text: < 1MB
- Rich Text with Images: < 5MB
- Complex Layouts: < 10MB

**If your section is larger, split it.**

## Error Messages & Meanings

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Content is too large to save" | > 95MB payload | Split sections or remove base64 |
| "Large content detected" | 50-95MB payload | Optimize or split soon |
| "Upload images to Supabase Storage" | Base64 detected | Use image URLs instead |
| "Content too large. Please reduce..." | Save failed | Follow suggestions above |

## Checklist Before Saving

- [ ] No base64 images (check image src doesn't start with `data:`)
- [ ] Section size is reasonable (< 40MB)
- [ ] Using external URLs for all images
- [ ] Content is focused on one topic
- [ ] Tested saving one section first

## Still Having Issues?

1. **Check Browser Console:**
   - Press F12
   - Look for error details
   - Check payload size logs

2. **Measure Your Content:**
   - Open browser console
   - Check for size warnings
   - Review optimization logs

3. **Review Content:**
   - Search for `data:image` in your content
   - Check for very long text blocks
   - Look for complex nested HTML

4. **Read Full Guide:**
   - See `PAYLOAD_SIZE_GUIDE.md` for detailed help
   - Review best practices
   - Follow migration guide for existing content

## Quick Reference

### Size Limits

```
Maximum: 95MB per save
Warning: 50MB per save
Recommended: < 40MB per section
```

### Best Practices

1. ✅ Use Supabase Storage for images
2. ✅ Save sections individually
3. ✅ Keep sections focused
4. ✅ Remove unnecessary formatting
5. ❌ Never use base64 images
6. ❌ Don't save huge sections
7. ❌ Avoid "Save All" for large pages

## Support

For more help:
- Read `PAYLOAD_SIZE_GUIDE.md` for comprehensive guide
- Read `413_ERROR_FIX_SUMMARY.md` for technical details
- Check browser console for specific errors
- Review content for base64 images

**Remember:** The system now automatically optimizes content and prevents most errors. If you still see 413 errors, your content is genuinely too large and needs to be split or reduced.
