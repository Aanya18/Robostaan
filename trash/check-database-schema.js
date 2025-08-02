// Check Database Schema for Gallery Issues
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema for Gallery Issues...\n');

  try {
    // 1. Check events table structure
    console.log('1. Events Table Structure:');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventsError) {
      console.error('❌ Events table error:', eventsError.message);
    } else if (events && events.length > 0) {
      console.log('✅ Events table exists');
      console.log('   Columns:', Object.keys(events[0]));
      
      // Check if cloudinary_folder column exists
      if (events[0].cloudinary_folder !== undefined) {
        console.log('✅ cloudinary_folder column exists');
      } else {
        console.log('❌ cloudinary_folder column MISSING!');
        console.log('   This is the main issue!');
      }
    } else {
      console.log('⚠️ Events table is empty');
    }

    // 2. Check for any gallery-related tables
    console.log('\n2. Checking for gallery tables:');
    
    const { data: galleryData, error: galleryError } = await supabase
      .from('gallery_images')
      .select('*')
      .limit(1);

    if (galleryError) {
      if (galleryError.message.includes('does not exist')) {
        console.log('ℹ️ gallery_images table does not exist (this is expected)');
      } else {
        console.log('❌ Gallery table error:', galleryError.message);
      }
    } else {
      console.log('✅ gallery_images table exists');
    }

    // 3. Test creating an event with cloudinary_folder
    console.log('\n3. Testing event creation with cloudinary_folder:');
    
    const testEvent = {
      title: 'Schema Test Event',
      description: 'Testing database schema',
      cloudinary_folder: 'schema-test-event',
      is_featured: false,
      tags: ['test']
    };

    const { data: createData, error: createError } = await supabase
      .from('events')
      .insert([testEvent])
      .select();

    if (createError) {
      console.error('❌ Failed to create test event:', createError.message);
      
      if (createError.message.includes('cloudinary_folder')) {
        console.log('\n💡 SOLUTION NEEDED:');
        console.log('   The cloudinary_folder column is missing from events table');
        console.log('   Need to add this column to store gallery folder names');
      }
    } else {
      console.log('✅ Test event created successfully');
      console.log('   ID:', createData[0].id);
      
      // Clean up test event
      await supabase
        .from('events')
        .delete()
        .eq('id', createData[0].id);
      console.log('✅ Test event cleaned up');
    }

    // 4. Check current events and their cloudinary_folder values
    console.log('\n4. Current Events Check:');
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('id, title, cloudinary_folder, created_at');

    if (allError) {
      console.error('❌ Error fetching events:', allError.message);
    } else {
      console.log(`📊 Found ${allEvents.length} events in database:`);
      allEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. "${event.title}"`);
        console.log(`      - ID: ${event.id}`);
        console.log(`      - Folder: ${event.cloudinary_folder || 'NOT SET'}`);
        console.log(`      - Created: ${new Date(event.created_at).toLocaleDateString()}`);
      });
    }

  } catch (error) {
    console.error('💥 Database check failed:', error.message);
  }
}

checkDatabaseSchema();