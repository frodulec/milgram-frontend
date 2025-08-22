// Image caching utility for better performance
class ImageCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 10; // Maximum number of images to cache
  }

  // Generate a cache key from image parameters
  generateKey(params) {
    return JSON.stringify(params);
  }

  // Get cached image blob
  get(key) {
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, item);
      return item;
    }
    return null;
  }

  // Set image in cache
  set(key, blob) {
    // If cache is full, remove oldest item
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, blob);
  }

  // Clear cache
  clear() {
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();