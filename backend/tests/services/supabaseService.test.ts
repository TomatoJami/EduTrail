import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => {
  const upload = vi.fn();
  const remove = vi.fn();
  const getPublicUrl = vi.fn();
  const from = vi.fn(() => ({ upload, remove, getPublicUrl }));

  return {
    upload,
    remove,
    getPublicUrl,
    from,
    createClient: vi.fn(() => ({
      storage: { from },
    })),
  };
});

const sharpMock = vi.hoisted(() => {
  const pipeline = {
    resize: vi.fn(() => pipeline),
    flatten: vi.fn(() => pipeline),
    jpeg: vi.fn(() => pipeline),
    toBuffer: vi.fn(),
  };

  return {
    pipeline,
    sharp: vi.fn(() => pipeline),
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseMock.createClient,
}));

vi.mock('sharp', () => ({
  default: sharpMock.sharp,
}));

describe('SupabaseService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2026-05-18T08:00:00.000Z'));
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    sharpMock.pipeline.toBuffer.mockResolvedValue(Buffer.from('resized-image'));
    supabaseMock.upload.mockResolvedValue({ data: { path: 'courses/cover.jpg' }, error: null });
    supabaseMock.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/images/courses/cover.jpg' },
    });
    supabaseMock.remove.mockResolvedValue({ error: null });
  });

  it('fails fast when required Supabase environment variables are missing', async () => {
    vi.stubEnv('SUPABASE_URL', '');

    // Importing the service creates the Supabase client, so missing secrets should be caught at startup.
    await expect(import('../../src/services/supabaseService')).rejects.toThrow(
      'Missing Supabase environment variables'
    );
  });

  it('resizes and uploads images to the selected storage folder', async () => {
    const { SupabaseService } = await import('../../src/services/supabaseService');

    const imageUrl = await new SupabaseService().uploadImage(Buffer.from('raw-image'), 'cover.jpg', 'courses');

    // The image pipeline keeps uploaded assets small and consistently displayable in the course UI.
    expect(sharpMock.pipeline.resize).toHaveBeenCalledWith(400, 400, {
      fit: 'cover',
      position: 'center',
    });
    expect(supabaseMock.from).toHaveBeenCalledWith('images');
    expect(supabaseMock.upload).toHaveBeenCalledWith('courses/1779091200000-cover.jpg', Buffer.from('resized-image'), {
      contentType: 'image/jpeg',
      upsert: false,
    });
    expect(imageUrl).toBe('https://example.supabase.co/storage/v1/object/public/images/courses/cover.jpg');
  });

  it('removes the object path from the images bucket when deleting by public URL', async () => {
    const { SupabaseService } = await import('../../src/services/supabaseService');

    await new SupabaseService().deleteImage(
      'https://example.supabase.co/storage/v1/object/public/images/courses/cover.jpg'
    );

    // Supabase Storage remove receives object paths relative to the bucket, not bucket-prefixed paths.
    expect(supabaseMock.remove).toHaveBeenCalledWith(['courses/cover.jpg']);
  });
});
