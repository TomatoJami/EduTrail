import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Wraps Supabase Storage calls so controllers/services do not handle raw storage APIs.
export class SupabaseService {
  /**
   * Загрузить картинку в Supabase Storage
   * @param file - бинарные данные файла
   * @param fileName - имя файла
   * @param folder - папка хранилища (subjects, courses)
   * @returns публичный URL картинки
   */
  async uploadImage(file: Buffer, fileName: string, folder: 'subjects' | 'courses' | 'questions' | 'chapters'): Promise<string> {
    // Uploads a generated filename into the selected images subfolder.
    try {
      const resizedImage = await sharp(file)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
        })
        .flatten({ background: '#fff' })
        .jpeg({ quality: 85 })
        .toBuffer();

      const filePath = `${folder}/${Date.now()}-${fileName}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, resizedImage, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      // Return a public URL because course images are displayed to all learners.
      const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(data.path);

      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return publicUrlData.publicUrl;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to resize or upload image');
    }
  }

  /**
   * Удалить картинку из Supabase Storage
   * @param imageUrl - публичный URL картинки
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // Converts a public Supabase URL back to a storage path and removes it.
    try {
      // Extract the object path from the public URL.
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/object/public/images/');
      if (pathParts.length < 2) {
        throw new Error('Invalid image URL');
      }

      const filePath = pathParts[1];

      const { error } = await supabase.storage.from('images').remove([filePath]);

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
      }
    } catch {
      // Keep image cleanup non-blocking for course updates.
    }
  }
}

export const supabaseService = new SupabaseService();
