export class ImageDownloadError extends Error {
  public readonly failedUrls: string[];

  constructor(failedUrls: string[]) {
    super('Failed to download images');
    this.failedUrls = failedUrls;
  }
}
