// Fix RLS Policies for Gallery Upload
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

async function fixRLSPolicies() {
  console.log('🔧 Checking and Fixing RLS Policies...\n');

  try {
    // Test current authentication status
    console.log('1. Checking Authentication:');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('⚠️ No user authenticated');
      console.log('   This might be the issue - RLS policies require authentication');
    }

    // Test event operations with current permissions
    console.log('\n2. Testing Event Operations:');
    
    // Try to select events (should work)
    const { data: readEvents, error: readError } = await supabase
      .from('events')
      .select('id, title, cloudinary_folder')
      .limit(5);

    if (readError) {
      console.error('❌ Cannot read events:', readError.message);
    } else {
      console.log(`✅ Can read events: ${readEvents.length} found`);
    }

    // Try to insert an event (might fail due to RLS)
    console.log('\n3. Testing Event Creation:');
    const testEvent = {
      title: 'RLS Test Event',
      description: 'Testing RLS policies',
      cloudinary_folder: 'rls-test-event',
      is_featured: false,
      tags: ['test', 'rls']
    };

    const { data: insertData, error: insertError } = await supabase
      .from('events')
      .insert([testEvent])
      .select();

    if (insertError) {
      console.error('❌ Cannot create event:', insertError.message);
      
      if (insertError.message.includes('row-level security')) {
        console.log('\n💡 RLS POLICY ISSUE DETECTED!');
        console.log('   Solutions:');
        console.log('   1. Sign in as admin user first');
        console.log('   2. Update RLS policies to allow inserts');
        console.log('   3. Use service role key for admin operations');
        
        // Try with admin authentication
        console.log('\n4. Attempting Admin Sign-in:');
        await attemptAdminLogin();
      }
    } else {
      console.log('✅ Event created successfully:', insertData[0].id);
      
      // Clean up
      await supabase
        .from('events')
        .delete()
        .eq('id', insertData[0].id);
      console.log('✅ Test event cleaned up');
    }

  } catch (error) {
    console.error('💥 RLS check failed:', error.message);
  }
}

async function attemptAdminLogin() {
  try {
    // Try to sign in with a test admin account
    console.log('   Attempting to authenticate...');
    
    // Since we don't have admin credentials, let's check what we can do
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.log('   ⚠️ Cannot access profiles table:', profileError.message);
    } else {
      console.log('   ✅ Can access profiles table');
    }

    // Check if there's an admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) {
      console.log('   ⚠️ Cannot check admin users:', adminError.message);
    } else if (adminUser && adminUser.length > 0) {
      console.log('   ✅ Admin user exists in database');
    } else {
      console.log('   ⚠️ No admin user found');
    }

  } catch (error) {
    console.log('   ❌ Admin login attempt failed:', error.message);
  }
}

fixRLSPolicies();