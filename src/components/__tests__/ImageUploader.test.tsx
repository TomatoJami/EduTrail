import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageUploader } from '@/components/ImageUploader';
import * as apiClient from '@/utils/apiClient';

vi.mock('@/utils/apiClient');

describe('ImageUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the file input and upload button', () => {
      const onImageUpload = vi.fn();

      render(<ImageUploader onImageUpload={onImageUpload} />);

      const buttons = screen.getAllByRole('button');
      const uploadButton = buttons.find((btn) => btn.textContent?.includes('Upload'));

      expect(uploadButton).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const onImageUpload = vi.fn();

      const { container } = render(
        <ImageUploader onImageUpload={onImageUpload} className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');

      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should accept valid image files', () => {
      const onImageUpload = vi.fn();

      render(<ImageUploader onImageUpload={onImageUpload} />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      waitFor(() => {
        expect(screen.getByText(/preview/i)).toBeInTheDocument();
      });
    });

    it('should reject non-image files', async () => {
      const onImageUpload = vi.fn();

      render(<ImageUploader onImageUpload={onImageUpload} />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Please select a valid image file/i)).toBeInTheDocument();
      });
    });

    it('should enforce maximum file size of 5MB', async () => {
      const onImageUpload = vi.fn();

      render(<ImageUploader onImageUpload={onImageUpload} />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      const largeFile = new File(
        [new ArrayBuffer(6 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Image size must be less than 5MB/i)).toBeInTheDocument();
      });
    });
  });

  describe('Upload functionality', () => {
    it('should call onImageUpload with the URL on successful upload', async () => {
      const onImageUpload = vi.fn();
      const mockResponse = {
        success: true,
        message: 'Image uploaded successfully',
        data: { imageUrl: 'https://example.com/image.jpg' },
      };

      vi.mocked(apiClient.apiClient.upload.image).mockResolvedValue(mockResponse);

      render(<ImageUploader onImageUpload={onImageUpload} />);

      const buttons = screen.getAllByRole('button');
      const uploadButton = buttons.find((btn) => btn.textContent?.includes('Upload'));

      fireEvent.click(uploadButton!);

      await waitFor(() => {
        expect(onImageUpload).toHaveBeenCalledWith('https://example.com/image.jpg');
      });
    });

    it('should show error on upload failure', async () => {
      const onImageUpload = vi.fn();

      vi.mocked(apiClient.apiClient.upload.image).mockResolvedValue({
        success: false,
        message: 'Upload failed',
        error: 'Upload failed',
      });

      render(<ImageUploader onImageUpload={onImageUpload} />);

      const buttons = screen.getAllByRole('button');
      const uploadButton = buttons.find((btn) => btn.textContent?.includes('Upload'));

      fireEvent.click(uploadButton!);

      await waitFor(() => {
        expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
      });
    });

    it('should set userId when provided', async () => {
      const onImageUpload = vi.fn();

      vi.mocked(apiClient.apiClient.upload.image).mockResolvedValue({
        success: true,
        message: 'Image uploaded successfully',
        data: { imageUrl: 'https://example.com/image.jpg' },
      });

      render(<ImageUploader onImageUpload={onImageUpload} userId="user-123" />);

      await waitFor(() => {
        expect(apiClient.apiClient.setUserId).toHaveBeenCalledWith('user-123');
      });
    });
  });

  describe('Folder selection', () => {
    it('should accept custom folder parameter', async () => {
      const onImageUpload = vi.fn();

      vi.mocked(apiClient.apiClient.upload.image).mockResolvedValue({
        success: true,
        message: 'Image uploaded successfully',
        data: { imageUrl: 'https://example.com/image.jpg' },
      });

      render(<ImageUploader onImageUpload={onImageUpload} folder="chapters" />);

      const buttons = screen.getAllByRole('button');
      const uploadButton = buttons.find((btn) => btn.textContent?.includes('Upload'));

      fireEvent.click(uploadButton!);

      await waitFor(() => {
        expect(apiClient.apiClient.upload.image).toHaveBeenCalledWith(
          expect.any(File),
          'chapters'
        );
      });
    });

    it('should default folder to subjects', async () => {
      const onImageUpload = vi.fn();

      vi.mocked(apiClient.apiClient.upload.image).mockResolvedValue({
        success: true,
        message: 'Image uploaded successfully',
        data: { imageUrl: 'https://example.com/image.jpg' },
      });

      render(<ImageUploader onImageUpload={onImageUpload} />);

      const buttons = screen.getAllByRole('button');
      const uploadButton = buttons.find((btn) => btn.textContent?.includes('Upload'));

      fireEvent.click(uploadButton!);

      await waitFor(() => {
        expect(apiClient.apiClient.upload.image).toHaveBeenCalledWith(
          expect.any(File),
          'subjects'
        );
      });
    });
  });

  describe('Cancel functionality', () => {
    it('should clear preview when cancel is clicked', async () => {
      const onImageUpload = vi.fn();

      render(<ImageUploader onImageUpload={onImageUpload} />);

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find((btn) => btn.textContent?.includes('Cancel'));

      fireEvent.click(cancelButton!);

      await waitFor(() => {
        expect(screen.queryByText(/preview/i)).not.toBeInTheDocument();
      });
    });

    it('should clear error message on cancel', async () => {
      const onImageUpload = vi.fn();

      render(<ImageUploader onImageUpload={onImageUpload} />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find((btn) => btn.textContent?.includes('Cancel'));

      fireEvent.click(cancelButton!);

      await waitFor(() => {
        expect(screen.queryByText(/Please select a valid image file/i)).not.toBeInTheDocument();
      });
    });
  });
});
