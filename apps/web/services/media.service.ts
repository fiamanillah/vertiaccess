import { apiClient } from './api-client';

export type MediaCategory = 
  | 'SITE_PHOTO'
  | 'SITE_POLICY'
  | 'SITE_OWNERSHIP'
  | 'IDENTITY_VERIFICATION'
  | 'USER_AVATAR'
  | 'GENERAL';

export interface UploadUrlResponse {
  success: boolean;
  message: string;
  data: {
    uploadUrl: string;
    fileKey: string;
    bucket: 'PUBLIC' | 'PRIVATE';
  };
}

export interface UploadedFileMetadata {
  fileKey: string;
  fileName: string;
  fileSize: number;
  category: MediaCategory;
  url: string;
}

export const mediaService = {
  /**
   * Get a presigned S3 upload URL
   */
  async getUploadUrl(
    fileName: string,
    contentType: string,
    category: MediaCategory = 'GENERAL',
    entityId?: string
  ): Promise<UploadUrlResponse> {
    return apiClient.post<UploadUrlResponse>('/media/v1/upload-url', {
      fileName,
      contentType,
      category,
      entityId,
    });
  },

  /**
   * Perform the actual binary upload to S3 using the presigned URL
   */
  async uploadToS3(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during S3 upload'));
      xhr.send(file);
    });
  },

  /**
   * Delete a file from S3
   */
  async deleteMedia(category: MediaCategory, fileKey: string): Promise<void> {
    return apiClient.delete(`/media/v1/${category}`, {
      params: { fileKey },
    });
  },

  /**
   * Register the media in the database (specifically for site-related documents)
   */
  async registerMedia(metadata: Omit<UploadedFileMetadata, 'url'> & { entityId?: string }): Promise<any> {
    return apiClient.post('/media/v1/register', metadata);
  }
};
