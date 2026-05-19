import { supabaseService } from './supabaseService';

/** Keeps the supabase public images path logic isolated and reusable. */
const SUPABASE_PUBLIC_IMAGES_PATH = '/object/public/images/';
/** Keeps the markdown image regex logic isolated and reusable. */
const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/** Keeps the extract supabase image urls logic isolated and reusable. */
export function extractSupabaseImageUrls(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  const urls = new Set<string>();
  const trimmedValue = value.trim();

  if (/^https?:\/\/\S+$/.test(trimmedValue) && trimmedValue.includes(SUPABASE_PUBLIC_IMAGES_PATH)) {
    urls.add(trimmedValue);
  }

  for (const match of trimmedValue.matchAll(MARKDOWN_IMAGE_REGEX)) {
    const imageUrl = match[1]?.trim();
    if (imageUrl?.includes(SUPABASE_PUBLIC_IMAGES_PATH)) {
      urls.add(imageUrl);
    }
  }

  return [...urls];
}

/** Deletes supabase images. */
export async function deleteSupabaseImages(...values: Array<string | null | undefined>): Promise<void> {
  // Collect direct URLs and Markdown image URLs, then delete each unique Supabase image.
  const imageUrls = [...new Set(values.flatMap((value) => extractSupabaseImageUrls(value)))];

  // Delete images with retries and error logging so external failures don't crash DB operations.
  async function tryDelete(imageUrl: string, attempts = 3): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      try {
        await supabaseService.deleteImage(imageUrl);
        return;
      } catch (err) {
        // last attempt will fall through to logging
        if (i === attempts - 1) {
          console.error(`Failed to delete Supabase image ${imageUrl}:`, err);
        } else {
          // small backoff
          await new Promise((res) => setTimeout(res, 200 * (i + 1)));
        }
      }
    }
  }

  await Promise.all(imageUrls.map((imageUrl) => tryDelete(imageUrl)));
}

/** Deletes removed supabase images. */
export async function deleteRemovedSupabaseImages(
  previousValue?: string | null,
  nextValue?: string | null
): Promise<void> {
  // During edits, remove only images that disappeared from the updated content.
  const nextUrls = new Set(extractSupabaseImageUrls(nextValue));
  const removedUrls = extractSupabaseImageUrls(previousValue).filter((imageUrl) => !nextUrls.has(imageUrl));

  try {
    await deleteSupabaseImages(...removedUrls);
  } catch (err) {
    // Log but don't throw — caller code should decide whether to fail the request.
    console.error('Error deleting removed Supabase images:', err);
  }
}
