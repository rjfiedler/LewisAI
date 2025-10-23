class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isRateLimited(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Filter out old requests outside the time window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      return true;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    // Cleanup old entries periodically
    if (this.requests.size > 1000) {
      this.cleanup();
    }

    return false;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter(
        timestamp => now - timestamp < this.windowMs
      );
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }

  getRemainingRequests(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

module.exports = RateLimiter;