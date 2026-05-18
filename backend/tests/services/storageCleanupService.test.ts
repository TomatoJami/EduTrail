import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseServiceMock = vi.hoisted(() => ({
  deleteImage: vi.fn(),
}));

vi.mock('../../src/services/supabaseService', () => ({
  supabaseService: supabaseServiceMock,
}));

describe('storageCleanupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts Supabase image URLs from direct values and markdown content', async () => {
    const { extractSupabaseImageUrls } = await import('../../src/services/storageCleanupService');

    const urls = extractSupabaseImageUrls(
      [
        'Intro text',
        '![chapter](https://example.supabase.co/storage/v1/object/public/images/chapters/a.jpg)',
        '![external](https://cdn.example.com/keep.jpg)',
        '![again](https://example.supabase.co/storage/v1/object/public/images/chapters/a.jpg)',
      ].join('\n')
    );

    // Chapter images live inside markdown content, so cleanup needs to discover only our storage URLs.
    expect(urls).toEqual(['https://example.supabase.co/storage/v1/object/public/images/chapters/a.jpg']);
  });

  it('deduplicates URLs before deleting from Supabase Storage', async () => {
    const { deleteSupabaseImages } = await import('../../src/services/storageCleanupService');
    const imageUrl = 'https://example.supabase.co/storage/v1/object/public/images/courses/cover.jpg';

    await deleteSupabaseImages(imageUrl, `![cover](${imageUrl})`);

    // Deleting once avoids duplicate storage calls when the same image is referenced in several fields.
    expect(supabaseServiceMock.deleteImage).toHaveBeenCalledTimes(1);
    expect(supabaseServiceMock.deleteImage).toHaveBeenCalledWith(imageUrl);
  });

  it('deletes only URLs that were removed from the updated value', async () => {
    const { deleteRemovedSupabaseImages } = await import('../../src/services/storageCleanupService');
    const keptUrl = 'https://example.supabase.co/storage/v1/object/public/images/chapters/keep.jpg';
    const removedUrl = 'https://example.supabase.co/storage/v1/object/public/images/chapters/remove.jpg';

    await deleteRemovedSupabaseImages(`![keep](${keptUrl}) ![remove](${removedUrl})`, `![keep](${keptUrl})`);

    // Editing markdown should remove storage files only for images no longer referenced by the entity.
    expect(supabaseServiceMock.deleteImage).toHaveBeenCalledTimes(1);
    expect(supabaseServiceMock.deleteImage).toHaveBeenCalledWith(removedUrl);
  });
});
