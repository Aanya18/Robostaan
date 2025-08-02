import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filePath, description) {
  console.log(`🔄 Running: ${description}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          console.error(`❌ Error in statement: ${statement.substring(0, 100)}...`);
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Completed: ${description}`);
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    console.error(`❌ Error: ${error.message}`);
  }
}

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const { data, error } = await supabase.from('events').select('count');
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    } else {
      console.log('✅ Database connection successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return false;
  }
}

async function checkEventsTable() {
  console.log('🔍 Checking events table...');
  
  try {
    const { data, error, count } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('❌ Events table check failed:', error.message);
      return false;
    } else {
      console.log(`✅ Events table exists with ${count} records`);
      if (data && data.length > 0) {
        console.log('📝 Sample event:', JSON.stringify(data[0], null, 2));
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Events table check error:', error.message);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');
  
  // Test connection first
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('❌ Database connection failed. Please check your environment variables.');
    return;
  }
  
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  
  // Migration files in order
  const migrations = [
    {
      file: '20250118110000_setup_functions.sql',
      description: 'Setup basic functions and user_profiles table'
    },
    {
      file: '20250118115000_debug_functions.sql', 
      description: 'Setup debug functions'
    },
    {
      file: '20250118120000_events_table.sql',
      description: 'Create events table with RLS policies'
    },
    {
      file: '20250118125000_sample_events.sql',
      description: 'Insert sample events (if table is empty)'
    }
  ];
  
  console.log('\n📁 Running migrations...\n');
  
  // Run each migration
  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration.file);
    
    if (fs.existsSync(filePath)) {
      await runMigration(filePath, migration.description);
    } else {
      console.log(`⚠️  Migration file not found: ${migration.file}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Final verification
  console.log('🔍 Final verification...\n');
  await checkEventsTable();
  
  console.log('\n🎉 Database setup completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Navigate to /events page');
  console.log('3. Click the 🐛 debug button to verify everything works');
  console.log('4. If you see events, the setup was successful!');
}

// Handle both direct execution and import
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(console.error);
}

export { setupDatabase };