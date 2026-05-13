import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export class SupabaseService {
  /**
   * Загрузить картинку в Supabase Storage
   * @param file - бинарные данные файла
   * @param fileName - имя файла
   * @param folder - папка хранилища (subjects, courses)
   * @returns публичный URL картинки
   */
  async uploadImage(file: Buffer, fileName: string, folder: 'subjects' | 'courses' | 'questions' | 'chapters'): Promise<string> {
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
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Получить публичный URL
      const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(data.path);

      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error resizing or uploading image:', error);
      throw error instanceof Error ? error : new Error('Failed to resize or upload image');
    }
  }

  /**
   * Удалить картинку из Supabase Storage
   * @param imageUrl - публичный URL картинки
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Извлечь путь из URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/object/public/images/');
      if (pathParts.length < 2) {
        throw new Error('Invalid image URL');
      }

      const filePath = `images/${pathParts[1]}`;

      const { error } = await supabase.storage.from('images').remove([filePath]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Не выбрасываем ошибку, просто логируем
    }
  }
}

export const supabaseService = new SupabaseService();
