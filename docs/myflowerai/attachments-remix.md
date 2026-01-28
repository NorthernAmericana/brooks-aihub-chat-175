# MyFlowerAI Image Remix Feature

## Overview

The Image Remix feature allows users to upload their own photos as inspiration for strain-based abstract art generation. This feature combines user-uploaded imagery with MyFlowerAI's signature psychedelic art style to create unique, personalized artwork.

## Feature Concept

When enabled, users can:
1. Upload a personal photo (landscape, memory, artwork, etc.)
2. Select a cannabis strain and customize vibe settings
3. Generate abstract art that draws stylistic inspiration from both the uploaded image and the strain profile

The generated artwork will be an **abstract interpretation** that captures the mood, color palette, and essence of the uploaded photo while maintaining MyFlowerAI's signature psychedelic art style.

## User Flow

1. Navigate to the MyFlowerAI Image Generator (`/MyFlowerAI/image-gen`)
2. Enable the "Use my photo as inspiration" toggle
3. Upload an image file (JPG, PNG, WEBP - max 4MB)
4. See a preview of the uploaded image
5. Select strain, persona, and vibe settings as usual
6. Click "Generate Image"
7. Receive abstract art inspired by both the photo and strain

## API Changes

### Image Generation Endpoint

**Endpoint:** `POST /api/myflowerai/generate-image`

#### New Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reference_image_url` | string | No | Vercel Blob URL of uploaded image to use as inspiration |
| `storage_key` | string | No | Alternative to `reference_image_url` - pathname from Vercel Blob storage |

#### Request Body Example

```json
{
  "strain_id": "trulieve-modern-flower-seed-junky-juicy-jane-3p5g",
  "persona_id": "creative-fire",
  "vibe_settings": {
    "intensity": 7,
    "neon": 3,
    "nature": 6,
    "surreal": 8,
    "chaos": 5
  },
  "user_vibe_text": "cosmic beach sunset",
  "reference_image_url": "https://blob.vercel-storage.com/abc123/photo.jpg"
}
```

#### Response (unchanged)

```json
{
  "success": true,
  "image_url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "title": "Juicy Jane (hybrid) - Creative Fire Vibe",
  "prompt_used": "Abstract psychedelic art: ...",
  "strain": {
    "id": "trulieve-modern-flower-seed-junky-juicy-jane-3p5g",
    "name": "Juicy Jane",
    "type": "hybrid"
  },
  "persona": {
    "id": "creative-fire",
    "name": "Creative Fire"
  }
}
```

## Implementation Details

### Image Upload Flow

1. User selects an image file via the UI file input
2. Image is uploaded to Vercel Blob via `/api/files/upload`
3. Upload returns `{ url, pathname, contentType }`
4. UI stores the `pathname` (storage_key) in component state for privacy
5. When generating, UI passes `storage_key: pathname` to the API
6. The reference image information is included in the prompt as text guidance

Note: DALL-E 3 does not support native image-to-image generation. The reference image serves as conceptual inspiration through enhanced text prompts that describe style transfer and abstraction. A future enhancement could integrate a vision API to analyze the uploaded image and extract specific color/mood information to further enhance the prompt.

### Prompt Composition with Remix

When a reference image is provided:

1. The prompt includes enhanced guidance text emphasizing:
   - **Style transfer** over exact reproduction
   - **Abstract interpretation** of visual elements
   - **Avoidance of text, logos, branding** from the source image
2. Combined prompt includes:
   - Strain-based visual characteristics
   - Reference image-inspired abstraction guidance
   - Standard safety constraints (no faces, no packaging, abstract only)

Note: DALL-E 3 does not directly analyze or use the uploaded image. The reference image serves as conceptual inspiration through text prompt modifications. Future enhancements may integrate vision APIs to extract color palettes and mood information from the uploaded image.

### Style Transfer Guidance

The prompt automatically includes remix-specific guidance:

```
"Inspired by the color palette and mood of the reference image, 
reimagined as abstract psychedelic art. Use color harmonies and 
emotional tone from the photo but translate all elements into 
abstract forms. If the image contains text, logos, or branding, 
represent them as abstract geometric patterns or color blocks. 
Do not reproduce any readable text or recognizable logos."
```

## Privacy & Security

### Privacy Rules

✅ **DO:**
- Store only the `pathname` (storage key) from Vercel Blob
- Use private/authenticated access for user-uploaded images
- Delete uploaded images after generation (optional retention policy)
- Keep user-uploaded images separate from public assets

❌ **DON'T:**
- Store signed URLs in git, database, or client-side code
- Make user-uploaded images publicly accessible
- Retain uploaded images indefinitely without user consent
- Include uploaded images in public repositories

### Security Considerations

1. **File Validation:**
   - Only accept image MIME types (image/jpeg, image/png, image/webp)
   - Enforce 4MB file size limit (same as existing upload endpoint)
   - Validate file headers to prevent spoofing

2. **Content Filtering:**
   - Reference images are user-uploaded (not AI-generated initially)
   - Generated output still follows all MyFlowerAI safety rules
   - Style transfer guidance helps avoid reproducing prohibited content

3. **Text/Logo Handling:**
   - If source image contains branding, logos, or text
   - Prompt explicitly instructs to use abstraction/style transfer
   - Avoid reproducing exact text or recognizable brand elements
   - Translate visual elements to abstract shapes and colors

## Usage Examples

### Example 1: Sunset Photo Remix

**User uploads:** Beach sunset photo  
**Selected strain:** White Sunshine (Sativa)  
**Vibe settings:** High intensity, medium neon, high nature  
**Result:** Abstract art with warm oranges/purples, upward flowing energy, organic forms inspired by the sunset's color palette

### Example 2: Urban Photography Remix

**User uploads:** City street at night  
**Selected strain:** Juicy Jane (Hybrid)  
**Persona:** Neon Arcade Brain  
**Vibe settings:** High neon, low nature, high surreal  
**Result:** Abstract geometric patterns with neon colors, balanced composition, dreamlike urban atmosphere translated to psychedelic art

### Example 3: Nature Macro Remix

**User uploads:** Close-up of flower petals  
**Selected strain:** Margalope (Hybrid)  
**Vibe settings:** Medium intensity, low chaos, high nature  
**Result:** Organic flowing patterns with soft gradients, petal-inspired curves and swirls, balanced energy

## Testing Checklist

- [ ] Upload image file via UI toggle
- [ ] Verify image preview displays correctly
- [ ] Verify `storage_key` is passed to API (not full URL)
- [ ] Test image generation with reference image
- [ ] Verify generated art is abstract (no exact reproduction)
- [ ] Test with image containing text/logos (verify abstraction)
- [ ] Verify no signed URLs stored in git
- [ ] Test without reference image (ensure backward compatibility)
- [ ] Verify file size limit enforcement (4MB)
- [ ] Verify file type validation (images only)

## Future Enhancements

- **Image Analysis AI:** Use vision API to extract specific color palettes and moods
- **Multiple Reference Images:** Combine inspiration from 2-3 images
- **Reference Image Gallery:** Save user's favorite reference images for reuse
- **Style Strength Slider:** Control how much the reference image influences the result
- **Image Editing:** Pre-crop or adjust reference image before generation

## Support & Resources

- Main documentation: `/docs/myflowerai/image-gen.md`
- API endpoint: `app/api/myflowerai/generate-image/route.ts`
- Prompt composer: `lib/myflowerai/image/prompt-composer.ts`
- Safety validation: `lib/myflowerai/image/safety.ts`
- UI page: `app/(chat)/MyFlowerAI/image-gen/page.tsx`
