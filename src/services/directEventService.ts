// Direct Event Service - Uses shared connection
import { Event } from '../lib/supabaseService';
import { getSupabaseConnection } from '../lib/supabaseConnection';

export class DirectEventService {
  
  static async getEvents(options: {
    limit?: number;
    featured?: boolean;
  } = {}): Promise<{ data: Event[]; error: any }> {
    console.log('🚀 DirectEventService.getEvents called with options:', options);
    
    const connection = getSupabaseConnection();
    
    return connection.executeWithRetry(async (client) => {
      let query = client.from('events').select('*');
      
      if (options.featured !== undefined) {
        query = query.eq('is_featured', options.featured);
        console.log('🔍 DirectEventService: Added featured filter:', options.featured);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
        console.log('🔍 DirectEventService: Added limit:', options.limit);
      }
      
      query = query.order('created_at', { ascending: false });
      console.log('🔍 DirectEventService: Added ordering');
      
      console.log('🚀 DirectEventService: Executing query with shared connection...');
      const { data, error } = await query;
      
      console.log('📊 DirectEventService: Result:', { data, error });
      console.log('📊 DirectEventService: Data length:', data?.length);
      console.log('📊 DirectEventService: First item:', data?.[0]);
      
      return { data: data ?? [], error };
    });
  }
  
  static async getFeaturedEvents(limit: number = 3): Promise<{ data: Event[]; error: any }> {
    console.log('🚀 DirectEventService.getFeaturedEvents called with limit:', limit);
    return this.getEvents({ featured: true, limit });
  }

  static async getEventById(id: string): Promise<{ data: Event | null; error: any }> {
    console.log('🚀 DirectEventService.getEventById called with id:', id);
    
    const connection = getSupabaseConnection();
    
    return connection.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      console.log('📊 DirectEventService: Event by ID result:', { data, error });
      
      return { data: data ?? null, error };
    });
  }
}

export default DirectEventService;