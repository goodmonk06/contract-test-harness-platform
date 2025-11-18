/**
 * Storage Adapter Interface
 *
 * Implement this interface to store test artifacts in different backends
 * (S3, GCS, Azure Blob, local filesystem, etc.)
 */

export interface StorageObject {
  key: string;
  content: Buffer | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface IStorageAdapter {
  /**
   * Store an object
   */
  put(object: StorageObject): Promise<string>;

  /**
   * Retrieve an object
   */
  get(key: string): Promise<Buffer | null>;

  /**
   * Delete an object
   */
  delete(key: string): Promise<void>;

  /**
   * List objects with optional prefix
   */
  list(prefix?: string): Promise<string[]>;

  /**
   * Get a public URL for an object (if supported)
   */
  getUrl(key: string): string | null;
}

/**
 * Local Filesystem Storage Adapter (Default)
 */
export class LocalStorageAdapter implements IStorageAdapter {
  constructor(private basePath: string = './storage') {}

  async put(object: StorageObject): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');

    const fullPath = path.join(this.basePath, object.key);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    const content = typeof object.content === 'string'
      ? Buffer.from(object.content)
      : object.content;

    await fs.writeFile(fullPath, content);

    // Write metadata if provided
    if (object.metadata) {
      await fs.writeFile(
        `${fullPath}.meta.json`,
        JSON.stringify(object.metadata, null, 2),
      );
    }

    return object.key;
  }

  async get(key: string): Promise<Buffer | null> {
    const fs = require('fs').promises;
    const path = require('path');

    const fullPath = path.join(this.basePath, key);

    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    const fullPath = path.join(this.basePath, key);

    try {
      await fs.unlink(fullPath);
      // Also delete metadata if exists
      try {
        await fs.unlink(`${fullPath}.meta.json`);
      } catch {
        // Ignore if metadata doesn't exist
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async list(prefix?: string): Promise<string[]> {
    const fs = require('fs').promises;
    const path = require('path');

    const searchPath = prefix
      ? path.join(this.basePath, prefix)
      : this.basePath;

    try {
      const files = await fs.readdir(searchPath, { recursive: true });
      return files.filter((f: string) => !f.endsWith('.meta.json'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  getUrl(key: string): string | null {
    // Local storage doesn't have public URLs
    return null;
  }
}

/**
 * S3 Storage Adapter (Stub)
 * TODO: Implement actual S3 integration using AWS SDK
 */
export class S3StorageAdapter implements IStorageAdapter {
  constructor(
    private bucket: string,
    private region: string = 'us-east-1',
  ) {}

  async put(object: StorageObject): Promise<string> {
    console.log(`[S3] PUT ${object.key} to bucket ${this.bucket}`);
    // TODO: Implement AWS S3 upload
    return object.key;
  }

  async get(key: string): Promise<Buffer | null> {
    console.log(`[S3] GET ${key} from bucket ${this.bucket}`);
    // TODO: Implement AWS S3 download
    return null;
  }

  async delete(key: string): Promise<void> {
    console.log(`[S3] DELETE ${key} from bucket ${this.bucket}`);
    // TODO: Implement AWS S3 delete
  }

  async list(prefix?: string): Promise<string[]> {
    console.log(`[S3] LIST ${prefix || '/'} in bucket ${this.bucket}`);
    // TODO: Implement AWS S3 list
    return [];
  }

  getUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
