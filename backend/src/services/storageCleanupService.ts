import { supabaseService } from './supabaseService';

const SUPABASE_PUBLIC_IMAGES_PATH = '/object/public/images/';
const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

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

export async function deleteSupabaseImages(...values: Array<string | null | undefined>): Promise<void> {
  const imageUrls = [...new Set(values.flatMap((value) => extractSupabaseImageUrls(value)))];

  await Promise.all(imageUrls.map((imageUrl) => supabaseService.deleteImage(imageUrl)));
}

export async function deleteRemovedSupabaseImages(
  previousValue?: string | null,
  nextValue?: string | null
): Promise<void> {
  const nextUrls = new Set(extractSupabaseImageUrls(nextValue));
  const removedUrls = extractSupabaseImageUrls(previousValue).filter((imageUrl) => !nextUrls.has(imageUrl));

  await deleteSupabaseImages(...removedUrls);
}
