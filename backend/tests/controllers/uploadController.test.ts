import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockResponse } from '../testUtils';
import { supabaseService } from '../../src/services/supabaseService';
import { UploadController } from '../../src/controllers/uploadController';

describe('UploadController', () => {
  const controller = new UploadController();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires a file', async () => {
    const res = createMockResponse();

    await controller.uploadImage({ query: {} } as Request, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No file provided',
    });
  });

  it('rejects unsupported file types', async () => {
    const res = createMockResponse();

    await controller.uploadImage({
      query: {},
      file: {
        mimetype: 'application/pdf',
        size: 100,
      },
    } as Request, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
    });
  });

  it('rejects files larger than 5MB', async () => {
    const res = createMockResponse();

    await controller.uploadImage({
      query: {},
      file: {
        mimetype: 'image/png',
        size: 5 * 1024 * 1024 + 1,
      },
    } as Request, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'File size exceeds 5MB limit',
    });
  });

  it('rejects unknown folders', async () => {
    const res = createMockResponse();

    await controller.uploadImage({
      query: { folder: 'avatars' },
      file: {
        mimetype: 'image/png',
        size: 100,
      },
    } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid folder. Must be "subjects", "courses", "questions", or "chapters"',
    });
  });

  it('uploads valid images through Supabase service', async () => {
    vi.spyOn(supabaseService, 'uploadImage').mockResolvedValue('https://cdn.example.com/image.jpg');
    const res = createMockResponse();
    const file = {
      buffer: Buffer.from('image'),
      originalname: 'course.png',
      mimetype: 'image/png',
      size: 100,
    };

    await controller.uploadImage({
      query: { folder: 'courses' },
      file,
    } as unknown as Request, res);

    expect(supabaseService.uploadImage).toHaveBeenCalledWith(file.buffer, 'course.png', 'courses');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: 'https://cdn.example.com/image.jpg',
        fileName: 'course.png',
        size: 100,
      },
    });
  });

  it('returns a 500 when storage upload fails', async () => {
    vi.spyOn(supabaseService, 'uploadImage').mockRejectedValue(new Error('storage down'));
    const res = createMockResponse();

    await controller.uploadImage({
      query: {},
      file: {
        buffer: Buffer.from('image'),
        originalname: 'course.png',
        mimetype: 'image/png',
        size: 100,
      },
    } as Request, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to upload image',
      error: 'storage down',
    });
  });
});
