import { getSupabaseConnection } from './supabaseConnection';

export interface QueuedRequest {
  id: string;
  type: 'like' | 'unlike' | 'comment' | 'reply' | 'edit_comment' | 'delete_comment';
  data: any;
  retryCount: number;
  maxRetries: number;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
}

export interface RequestQueueConfig {
  maxRetries: number;
  retryDelay: number;
  maxQueueSize: number;
  batchSize: number;
  connectionTimeout: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private connection = getSupabaseConnection();
  private config: RequestQueueConfig;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<RequestQueueConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      maxQueueSize: 100,
      batchSize: 5,
      connectionTimeout: 10000,
      ...config
    };

    this.startProcessing();
  }

  // Add a request to the queue
  async enqueue(
    type: QueuedRequest['type'],
    data: any,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: QueuedRequest = {
      id: requestId,
      type,
      data,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      timestamp: Date.now(),
      priority
    };

    // Add to queue based on priority
    if (priority === 'high') {
      this.queue.unshift(request);
    } else {
      this.queue.push(request);
    }

    // Limit queue size
    if (this.queue.length > this.config.maxQueueSize) {
      this.queue = this.queue.slice(0, this.config.maxQueueSize);
    }

    console.log(`Request queued: ${type} (${priority} priority)`, requestId);
    return requestId;
  }

  // Start processing the queue
  private startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      if (!this.processing && this.queue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }

  // Process the queue
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    console.log(`Processing queue: ${this.queue.length} requests pending`);

    try {
      // Ensure connection is established
      await this.ensureConnection();

      // Process requests in batches
      const batch = this.queue.splice(0, this.config.batchSize);
      
      for (const request of batch) {
        await this.processRequest(request);
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      // Re-queue failed requests with exponential backoff
      this.handleProcessingError(error);
    } finally {
      this.processing = false;
    }
  }

  // Ensure connection is established
  private async ensureConnection(): Promise<void> {
    try {
      const status = await this.connection.getConnectionStatus();
      
      if (status === 'disconnected' || status === 'error') {
        console.log('Connection lost, attempting to reconnect...');
        await this.connection.ensureConnection();
        
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Failed to establish connection:', error);
      throw new Error('Connection establishment failed');
    }
  }

  // Process individual request
  private async processRequest(request: QueuedRequest): Promise<void> {
    try {
      console.log(`Processing request: ${request.type}`, request.id);

      switch (request.type) {
        case 'like':
          await this.processLikeRequest(request);
          break;
        case 'unlike':
          await this.processUnlikeRequest(request);
          break;
        case 'comment':
          await this.processCommentRequest(request);
          break;
        case 'reply':
          await this.processReplyRequest(request);
          break;
        case 'edit_comment':
          await this.processEditCommentRequest(request);
          break;
        case 'delete_comment':
          await this.processDeleteCommentRequest(request);
          break;
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }

      console.log(`Request completed successfully: ${request.type}`, request.id);
    } catch (error) {
      console.error(`Request failed: ${request.type}`, request.id, error);
      await this.handleRequestError(request, error);
    }
  }

  // Process like request
  private async processLikeRequest(request: QueuedRequest): Promise<void> {
    const { blogId, userId } = request.data;
    
    await this.connection.executeWithRetry(async (client) => {
      const { error } = await client
        .from('blog_likes')
        .insert({ blog_id: blogId, user_id: userId });
      
      if (error) throw error;
    });
  }

  // Process unlike request
  private async processUnlikeRequest(request: QueuedRequest): Promise<void> {
    const { blogId, userId } = request.data;
    
    await this.connection.executeWithRetry(async (client) => {
      const { error } = await client
        .from('blog_likes')
        .delete()
        .eq('blog_id', blogId)
        .eq('user_id', userId);
      
      if (error) throw error;
    });
  }

  // Process comment request
  private async processCommentRequest(request: QueuedRequest): Promise<void> {
    const { content, userId, blogId, courseId } = request.data;
    
    console.log('🔄 Processing comment request:', { content, userId, blogId, courseId });
    
    await this.connection.executeWithRetry(async (client) => {
      const commentData = {
        content,
        user_id: userId,
        ...(blogId ? { blog_id: blogId } : { course_id: courseId })
      };

      console.log('📝 Inserting comment data:', commentData);

      const { data, error } = await client
        .from('comments')
        .insert([commentData])
        .select();
      
      if (error) {
        console.error('❌ Comment insert error:', error);
        throw error;
      }
      
      console.log('✅ Comment inserted successfully:', data);
    });
  }

  // Process reply request
  private async processReplyRequest(request: QueuedRequest): Promise<void> {
    const { content, userId, parentId, blogId, courseId } = request.data;
    
    console.log('🔄 Processing reply request:', { content, userId, parentId, blogId, courseId });
    
    await this.connection.executeWithRetry(async (client) => {
      const replyData = {
        content,
        user_id: userId,
        parent_id: parentId,
        ...(blogId ? { blog_id: blogId } : { course_id: courseId })
      };

      console.log('📝 Inserting reply data:', replyData);

      const { data, error } = await client
        .from('comments')
        .insert([replyData])
        .select();
      
      if (error) {
        console.error('❌ Reply insert error:', error);
        throw error;
      }
      
      console.log('✅ Reply inserted successfully:', data);
    });
  }

  // Process edit comment request
  private async processEditCommentRequest(request: QueuedRequest): Promise<void> {
    const { commentId, content } = request.data;
    
    await this.connection.executeWithRetry(async (client) => {
      const { error } = await client
        .from('comments')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);
      
      if (error) throw error;
    });
  }

  // Process delete comment request
  private async processDeleteCommentRequest(request: QueuedRequest): Promise<void> {
    const { commentId } = request.data;
    
    await this.connection.executeWithRetry(async (client) => {
      const { error } = await client
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    });
  }

  // Handle request error with retry logic
  private async handleRequestError(request: QueuedRequest, error: any): Promise<void> {
    request.retryCount++;

    if (request.retryCount <= request.maxRetries) {
      // Exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, request.retryCount - 1);
      
      console.log(`Retrying request ${request.id} in ${delay}ms (attempt ${request.retryCount}/${request.maxRetries})`);
      
      setTimeout(() => {
        // Re-queue with higher priority for retries
        const retryRequest = { ...request, priority: 'high' as const };
        this.queue.unshift(retryRequest);
      }, delay);
    } else {
      console.error(`Request ${request.id} failed after ${request.maxRetries} retries:`, error);
      // Could emit an event here for UI notification
      this.emitRequestFailed(request, error);
    }
  }

  // Handle processing error
  private handleProcessingError(error: any): void {
    console.error('Queue processing error, will retry:', error);
    
    // Re-queue all requests with exponential backoff
    const delay = this.config.retryDelay * 2;
    
    setTimeout(() => {
      // Move all requests back to queue
      this.queue.unshift(...this.queue.splice(0));
    }, delay);
  }

  // Emit request failed event
  private emitRequestFailed(request: QueuedRequest, error: any): void {
    // Create a custom event for UI notification
    const event = new CustomEvent('requestFailed', {
      detail: {
        requestId: request.id,
        type: request.type,
        error: error.message,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      pendingRequests: this.queue.filter(r => r.retryCount === 0).length,
      retryRequests: this.queue.filter(r => r.retryCount > 0).length
    };
  }

  // Clear queue
  clearQueue(): void {
    this.queue = [];
    console.log('Request queue cleared');
  }

  // Stop processing
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.processing = false;
    console.log('Request queue stopped');
  }

  // Resume processing
  resume(): void {
    this.startProcessing();
    console.log('Request queue resumed');
  }
}

// Create singleton instance
export const requestQueue = new RequestQueue();

// Export convenience functions
export const enqueueRequest = requestQueue.enqueue.bind(requestQueue);
export const getQueueStatus = requestQueue.getStatus.bind(requestQueue);
export const clearQueue = requestQueue.clearQueue.bind(requestQueue);
export const stopQueue = requestQueue.stop.bind(requestQueue);
export const resumeQueue = requestQueue.resume.bind(requestQueue); 