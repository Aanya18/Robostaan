import { createClient, SupabaseClient, AuthChangeEvent, Session, RealtimeChannel } from '@supabase/supabase-js';

// Types for better type safety
interface ConnectionConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  connectionTimeout: number;
  maxReconnectAttempts: number;
  visibilityCheckInterval: number;
  heartbeatInterval: number;
  reconnectBackoffMultiplier: number;
}

interface ChannelSubscription {
  channel: RealtimeChannel;
  callback: (payload: any) => void;
  table: string;
  lastActivity: number;
  isActive: boolean;
}

class SupabaseConnection {
  private client: SupabaseClient | null = null;
  private connectionPromise: Promise<SupabaseClient> | null = null;
  private isConnecting = false;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private visibilityTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isPageVisible = true;
  private lastSuccessfulOperation = Date.now();
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 3;

  // Configuration
  private readonly config: ConnectionConfig = {
    maxRetries: 5,
    retryDelay: 1000, // Back to 1000ms for stability
    healthCheckInterval: 30_000,
    connectionTimeout: 10_000, // Back to 10s for reliability
    maxReconnectAttempts: 5, // Back to 5 for faster failure detection
    visibilityCheckInterval: 5_000,
    heartbeatInterval: 30_000,
    reconnectBackoffMultiplier: 1.5
  };

  // Environment variables
  private readonly supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
  private readonly supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

  // Secure token storage keys
  private readonly secureStorageKeys = {
    authToken: 'sb-auth-token',
    refreshToken: 'sb-refresh-token',
    userProfile: 'user_profile',
    sessionData: 'session_data'
  };

  // Active realtime channels with metadata
  private activeChannels: Map<string, ChannelSubscription> = new Map();

  // Connection state
  private connectionState: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
  private lastHealthCheck = 0;
  private lastActivity = Date.now();

  constructor() {
    this.validateEnvironment();
    this.initializeConnection();
    this.setupVisibilityHandling();
    this.setupCleanup();
    this.startHeartbeat();
    this.startAggressiveHealthCheck();
  }

  private validateEnvironment(): void {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('[Supabase] Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }
    }

  private initializeConnection(): void {
    try {
    // Validate configuration
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.error('Supabase configuration missing. Please check your .env file for:');
      console.error('   - VITE_SUPABASE_URL');
      console.error('   - VITE_SUPABASE_ANON_KEY');
      throw new Error('Supabase configuration missing');
    }

    // Create client with proper configuration
    this.client = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: this.createSecureStorage(),
        storageKey: 'robostaan-auth'
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-application-name': 'robostaan',
          'x-client-info': 'robostaan-web'
        }
      },
      realtime: {
        params: { 
          eventsPerSecond: 10,
          heartbeatIntervalMs: 30000, // 30 second heartbeat
          reconnectAfterMs: (tries: number) => Math.min(tries * 500, 5000) // Faster reconnection
        }
      }
    });

      this.setupAuthMonitoring();
      this.startHealthCheck();
      this.connectionState = 'connected';
      
      console.info('[Supabase] Connection initialized successfully');
    } catch (error) {
      console.error('[Supabase] Failed to initialize connection:', error);
      this.connectionState = 'error';
      this.scheduleReconnection();
    }
  }

  private createSecureStorage() {
    return {
      getItem: (key: string): string | null => {
        try {
          // Use sessionStorage for sensitive data (cleared when tab closes)
          return sessionStorage.getItem(key);
        } catch (error) {
          console.warn('[Supabase] Failed to get item from storage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          sessionStorage.setItem(key, value);
        } catch (error) {
          console.warn('[Supabase] Failed to set item in storage:', error);
        }
      },
      removeItem: (key: string): void => {
        try {
          sessionStorage.removeItem(key);
          localStorage.removeItem(key); // Also remove from localStorage for cleanup
        } catch (error) {
          console.warn('[Supabase] Failed to remove item from storage:', error);
        }
      }
    };
  }

  private setupAuthMonitoring(): void {
    if (!this.client) return;

    this.client.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('[Supabase] Auth event:', event);

      switch (event) {
        case 'SIGNED_IN':
          this.lastActivity = Date.now();
          this.lastSuccessfulOperation = Date.now();
          this.reconnectAttempts = 0;
          this.consecutiveFailures = 0;
          break;

        case 'SIGNED_OUT':
          this.clearSecureData();
          this.unsubscribeAllChannels();
          break;

        case 'TOKEN_REFRESHED':
          console.info('[Supabase] Token refreshed successfully');
          this.lastActivity = Date.now();
          this.lastSuccessfulOperation = Date.now();
          this.consecutiveFailures = 0;
          break;

        case 'TOKEN_REFRESH_FAILED' as any:
          console.warn('[Supabase] Token refresh failed, signing out');
          await this.client?.auth.signOut();
          this.clearSecureData();
          break;

        case 'USER_UPDATED':
          this.lastActivity = Date.now();
          this.lastSuccessfulOperation = Date.now();
          break;
      }
    });
  }

  private setupVisibilityHandling(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = document.visibilityState === 'visible';
      
      if (this.isPageVisible) {
        this.onPageVisible();
      } else {
        this.onPageHidden();
      }
    });

    // Periodic visibility check
    this.visibilityTimer = setInterval(() => {
      if (this.isPageVisible && this.connectionState === 'connected') {
        this.checkSessionValidity();
      }
    }, this.config.visibilityCheckInterval);
  }

  private onPageVisible(): void {
    console.log('[Supabase] Page became visible, checking connection...');
    this.lastActivity = Date.now();
    
    // Resume health checks
    this.startHealthCheck();
    
    // Check if connection is healthy
    if (this.connectionState !== 'connected') {
      console.log('[Supabase] Connection not healthy, attempting reconnect...');
      this.scheduleReconnection();
    }
  }

  private onPageHidden(): void {
    console.log('[Supabase] Page hidden, pausing health checks');
    this.stopHealthCheck();
  }

  private async checkSessionValidity(): Promise<void> {
    if (!this.client) return;

    try {
      const { data: { session } } = await this.client.auth.getSession();
      if (session && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        
        if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) { // 5 minutes
          console.log('[Supabase] Session expiring soon, refreshing...');
          await this.client.auth.refreshSession();
        }
      }
    } catch (error) {
      console.warn('[Supabase] Session validation failed:', error);
    }
  }

  private startHealthCheck(): void {
    if (this.healthCheckTimer) return;
    
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    
    this.heartbeatTimer = setInterval(() => {
      this.performHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async performHeartbeat(): Promise<void> {
    if (!this.client || !this.isPageVisible) return;

    try {
      // Lightweight ping to keep connection alive
      const { error } = await this.client!
        .from('courses')
        .select('id')
        .limit(1)
        .abortSignal(AbortSignal.timeout(3000)); // 3 second timeout for heartbeat

      if (!error) {
        this.lastSuccessfulOperation = Date.now();
        this.consecutiveFailures = 0;
      }
    } catch (error) {
      // Heartbeat failures don't trigger immediate reconnection
      console.debug('[Supabase] Heartbeat failed:', error);
    }
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.client || !this.isPageVisible) return;

    try {
      const startTime = Date.now();
      
      // Use a lightweight query for health check
      const { error } = await this.client!
        .from('courses')
        .select('id')
        .limit(1)
        .abortSignal(AbortSignal.timeout(this.config.connectionTimeout));

      const responseTime = Date.now() - startTime;
      
      if (error) {
        this.consecutiveFailures++;
        console.warn(`[Supabase] Health check failed (${this.consecutiveFailures}/${this.maxConsecutiveFailures}):`, error.message);
        
        if (this.isConnectionError(error) || this.consecutiveFailures >= this.maxConsecutiveFailures) {
          await this.handleConnectionError();
          this.startAggressiveHealthCheck();
        }
      } else {
        this.lastHealthCheck = Date.now();
        this.lastSuccessfulOperation = Date.now();
        this.reconnectAttempts = 0;
        this.consecutiveFailures = 0;
        
        if (responseTime > 3000) {
          console.warn(`[Supabase] Slow response time: ${responseTime}ms`);
        }
      }
    } catch (error: any) {
      this.consecutiveFailures++;
      console.warn(`[Supabase] Health check error (${this.consecutiveFailures}/${this.maxConsecutiveFailures}):`, error);
      
      if (error.name === 'TimeoutError' || this.consecutiveFailures >= this.maxConsecutiveFailures) {
        await this.handleConnectionError();
        this.startAggressiveHealthCheck();
      }
    }
  }

  private isConnectionError(error: any): boolean {
    const connectionErrors = [
      'connection', 'network', 'timeout', 'PGRST301', 'PGRST302',
      'fetch', 'abort', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT',
      'ERR_NETWORK', 'ERR_INTERNET_DISCONNECTED', 'ERR_CONNECTION_REFUSED'
    ];
    
    return connectionErrors.some(str => 
      error?.message?.toLowerCase().includes(str) || 
      error?.code?.toLowerCase().includes(str) ||
      error?.name?.toLowerCase().includes(str)
    );
  }

  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      // Instead of giving up, schedule another reconnection attempt after 10 seconds
      this.connectionState = 'error';
      setTimeout(() => {
        if (this.connectionState !== 'connected') {
          this.reconnectAttempts = 0; // Optionally reset attempts
          this.handleConnectionError();
        }
      }, 10000); // 10 seconds
      return;
    }

    this.reconnectAttempts++;
    console.warn(`[Supabase] Attempting reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    try {
      await this.reconnect();
    } catch (err) {
      // If reconnect fails, schedule another attempt in 5 seconds
      setTimeout(() => {
        if (this.connectionState !== 'connected') {
          this.handleConnectionError();
        }
      }, 5000);
    }
  }

  private scheduleReconnection(): void {
    if (this.connectionState === 'connecting') return;
    
    setTimeout(async () => {
      if (this.connectionState !== 'connected') {
        console.log('[Supabase] Scheduled reconnection triggered');
        await this.reconnect();
      }
    }, this.config.retryDelay);
  }

  private async connect(): Promise<SupabaseClient> {
    if (this.client && this.connectionState === 'connected') return this.client;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.connectionState = 'connecting';
        
        // Create new client if needed
        if (!this.client) {
        this.initializeConnection();
        }
        
        if (!this.client) {
          throw new Error('Client not initialized');
        }

        // Test connection with timeout
        const client = this.client;
        const { error } = await client
          .from('blogs')
          .select('id')
          .limit(1)
          .abortSignal(AbortSignal.timeout(this.config.connectionTimeout));

        if (error && !error.message.includes('relation')) {
          throw error;
        }

        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.consecutiveFailures = 0;
        this.lastSuccessfulOperation = Date.now();
        console.info('[Supabase] Connection established successfully');
        
        return this.client;
      } catch (error: any) {
        console.error(`[Supabase] Connection attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.maxRetries) {
          const backoffDelay = this.config.retryDelay * Math.pow(this.config.reconnectBackoffMultiplier, attempt - 1);
          await this.delay(backoffDelay);
        } else {
          this.connectionState = 'error';
          throw new Error(`Failed to connect after ${this.config.maxRetries} attempts`);
        }
      }
    }

    throw new Error('Connection failed');
  }

  public async getClient(): Promise<SupabaseClient> {
    if (this.client && this.connectionState === 'connected') {
      return this.client;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.connect();

    try {
      const client = await this.connectionPromise;
      return client;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  public async reconnect(): Promise<SupabaseClient> {
    console.log('[Supabase] Starting reconnection process...');
    
    // Clean up existing connection
    this.client = null;
    this.connectionPromise = null;
    this.isConnecting = false;
    this.connectionState = 'disconnected';

    // Get new client
    const newClient = await this.getClient();

    // Reconnect active channels
    await this.reconnectActiveChannels();

    return newClient;
  }

  public async executeWithRetry<T>(
    operation: (client: SupabaseClient) => Promise<T>,
    maxRetries = 3, // Increased from 2 to 3
    timeout = this.config.connectionTimeout
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const client = await this.getClient();
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const result = await operation(client);
          clearTimeout(timeoutId);
          this.lastSuccessfulOperation = Date.now();
          this.consecutiveFailures = 0;
          return result;
        } catch (error: any) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error: any) {
        const isRetryable = this.isRetryableError(error);

        if (isRetryable && attempt <= maxRetries) {
          console.warn(`[Supabase] Retrying operation (attempt ${attempt}/${maxRetries})`);
          await this.reconnect();
          const backoffDelay = this.config.retryDelay * Math.pow(this.config.reconnectBackoffMultiplier, attempt - 1);
          await this.delay(backoffDelay);
        } else {
          throw error;
        }
      }
    }

    throw new Error('Operation failed after all retries');
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'connection', 'network', 'timeout', 'PGRST301', 'PGRST302',
      'fetch', 'abort', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT',
      'ERR_NETWORK', 'ERR_INTERNET_DISCONNECTED', 'ERR_CONNECTION_REFUSED'
    ];
    
    return retryableErrors.some(str => 
      error?.message?.toLowerCase().includes(str) || 
      error?.code?.toLowerCase().includes(str) ||
      error?.name?.toLowerCase().includes(str)
    );
  }

  // ========== REALTIME CHANNEL MANAGEMENT ==========

  public async subscribeToChannel(
    channelName: string,
    onChange: (payload: any) => void,
    table = 'blogs',
    options: { 
      events?: string[], 
      filter?: string,
      autoReconnect?: boolean 
    } = {}
  ): Promise<void> {
    try {
    const client = await this.getClient();

    const channel = client
      .channel(channelName)
          .on(
            'postgres_changes' as any,
            {
              event: options.events || '*',
              schema: 'public',
              table: table,
              filter: options.filter
            },
            (payload: any) => {
              this.lastActivity = Date.now();
        onChange(payload);
            }
          )
        .subscribe((status) => {
          console.log(`[Supabase] Channel ${channelName} status:`, status);
          
          if (status === 'SUBSCRIBED') {
            this.activeChannels.set(channelName, {
              channel,
              callback: onChange,
              table,
              lastActivity: Date.now(),
              isActive: true
            });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`[Supabase] Channel ${channelName} error, will retry...`);
            this.scheduleChannelReconnect(channelName);
        }
      });

    } catch (error) {
      console.error(`[Supabase] Failed to subscribe to channel ${channelName}:`, error);
      throw error;
    }
  }

  private scheduleChannelReconnect(channelName: string): void {
    setTimeout(async () => {
      const subscription = this.activeChannels.get(channelName);
      if (subscription && subscription.isActive) {
        try {
          await this.unsubscribeFromChannel(channelName);
          await this.subscribeToChannel(
            channelName,
            subscription.callback,
            subscription.table
          );
        } catch (error) {
          console.error(`[Supabase] Failed to reconnect channel ${channelName}:`, error);
        }
      }
    }, this.config.retryDelay);
  }

  public async unsubscribeFromChannel(channelName: string): Promise<void> {
    const subscription = this.activeChannels.get(channelName);
    if (subscription) {
      try {
        await subscription.channel.unsubscribe();
    this.activeChannels.delete(channelName);
        console.log(`[Supabase] Unsubscribed from channel ${channelName}`);
      } catch (error) {
        console.error(`[Supabase] Error unsubscribing from channel ${channelName}:`, error);
      }
    }
  }

  public async unsubscribeAllChannels(): Promise<void> {
    const unsubscribePromises = Array.from(this.activeChannels.keys()).map(
      channelName => this.unsubscribeFromChannel(channelName)
    );
    
    await Promise.allSettled(unsubscribePromises);
    this.activeChannels.clear();
  }

  private async reconnectActiveChannels(): Promise<void> {
    const channelsToReconnect = Array.from(this.activeChannels.entries());
    
    for (const [channelName, subscription] of channelsToReconnect) {
      if (subscription.isActive) {
        try {
          await this.subscribeToChannel(
            channelName,
            subscription.callback,
            subscription.table
          );
        } catch (error) {
          console.error(`[Supabase] Failed to reconnect channel ${channelName}:`, error);
        }
      }
    }
  }

  private markChannelsInactive(): void {
    for (const [channelName, subscription] of this.activeChannels.entries()) {
      subscription.isActive = false;
      subscription.lastActivity = Date.now();
    }
  }

  private reconnectInactiveChannels(): void {
    for (const [channelName, subscription] of this.activeChannels.entries()) {
      if (!subscription.isActive) {
        subscription.isActive = true;
        console.log(`[Supabase] Reactivating channel "${channelName}"`);
      }
    }
  }

  // ========== UTILITY METHODS ==========

  public getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    return this.connectionState;
  }

  public isConnected(): boolean {
    return this.connectionState === 'connected' && this.client !== null;
  }

  public getActiveChannelsCount(): number {
    return this.activeChannels.size;
  }

  public getLastActivity(): number {
    return this.lastActivity;
  }

  public getHealthStatus(): {
    connectionState: string;
    lastHealthCheck: number;
    reconnectAttempts: number;
    activeChannels: number;
    isPageVisible: boolean;
    lastSuccessfulOperation: number;
    consecutiveFailures: number;
    uptime: number;
  } {
    return {
      connectionState: this.connectionState,
      lastHealthCheck: this.lastHealthCheck,
      reconnectAttempts: this.reconnectAttempts,
      activeChannels: this.activeChannels.size,
      isPageVisible: this.isPageVisible,
      lastSuccessfulOperation: this.lastSuccessfulOperation,
      consecutiveFailures: this.consecutiveFailures,
      uptime: Date.now() - this.lastActivity
    };
  }

  public async forceReconnect(): Promise<void> {
    console.log('[Supabase] Force reconnection requested');
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    this.consecutiveFailures = 0;
    await this.reconnect();
  }

  public async checkConnectionHealth(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const { error } = await client
        .from('blogs')
        .select('id')
        .limit(1)
        .abortSignal(AbortSignal.timeout(5000));

      if (error) {
        console.warn('[Supabase] Connection health check failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[Supabase] Connection health check error:', error);
      return false;
    }
  }

  private clearSecureData(): void {
    try {
      Object.values(this.secureStorageKeys).forEach(key => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });
      console.log('[Supabase] Secure data cleared');
    } catch (error) {
      console.warn('[Supabase] Failed to clear secure data:', error);
    }
  }

  private setupCleanup(): void {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.unsubscribeAllChannels();
      this.stopHealthCheck();
      this.stopHeartbeat();
    });

    // Cleanup on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.stopHealthCheck();
      } else {
        this.startHealthCheck();
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public cleanup(): void {
    console.log('[Supabase] Cleaning up connection...');
    
    this.unsubscribeAllChannels();
    this.stopHealthCheck();
    this.stopHeartbeat();
    
    if (this.visibilityTimer) {
      clearInterval(this.visibilityTimer);
      this.visibilityTimer = null;
    }
    
    this.client = null;
    this.connectionPromise = null;
    this.isConnecting = false;
    this.connectionState = 'disconnected';
    
    console.log('[Supabase] Cleanup completed');
  }

  // Add a method to start aggressive health checks when disconnected
  private startAggressiveHealthCheck(): void {
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    this.healthCheckTimer = setInterval(() => {
      if (this.connectionState !== 'connected') {
        this.performHealthCheck();
      }
    }, 5000); // 5 seconds when disconnected
  }
}

// Singleton instance
let connectionInstance: SupabaseConnection | null = null;

export function getSupabase(): Promise<SupabaseClient> {
  if (!connectionInstance) {
    connectionInstance = new SupabaseConnection();
  }
  return connectionInstance.getClient();
}

export function getSupabaseConnection(): SupabaseConnection {
  if (!connectionInstance) {
    connectionInstance = new SupabaseConnection();
  }
  return connectionInstance;
}

// Export for debugging and monitoring
export function getConnectionHealth() {
  return connectionInstance?.getHealthStatus();
}

export function forceReconnect() {
  return connectionInstance?.forceReconnect();
}

export function checkConnectionHealth() {
  return connectionInstance?.checkConnectionHealth();
}
