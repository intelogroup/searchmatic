import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkProjectSchema() {
  console.log('🔍 Checking projects table schema...')
  
  try {
    // Get table columns
    const { data: columns, error: columnsError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'projects' 
          ORDER BY ordinal_position;
        `
      })
    
    if (columnsError) {
      console.log('Trying alternative method...')
      
      // Try direct query
      const { data: result, error } = await supabase
        .from('projects')
        .select('*')
        .limit(0)
      
      if (error) {
        console.error('❌ Error:', error.message)
        return
      }
      
      console.log('✅ Projects table exists and is accessible')
      console.log('Columns can be seen from insert errors or Supabase dashboard')
    } else {
      console.log('✅ Projects table schema:')
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
      })
    }
    
    // Check enums
    console.log('\n🎯 Checking for enum types...')
    const { data: enums, error: enumError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT t.typname as enum_name, array_agg(e.enumlabel) as enum_values
          FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid  
          WHERE t.typname LIKE '%status%' OR t.typname LIKE '%project%'
          GROUP BY t.typname;
        `
      })
    
    if (enumError) {
      console.log('❌ Could not check enums:', enumError.message)
    } else if (enums && enums.length > 0) {
      enums.forEach(enumType => {
        console.log(`  ${enumType.enum_name}: [${enumType.enum_values.join(', ')}]`)
      })
    } else {
      console.log('  No relevant enum types found')
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message)
  }
}

checkProjectSchema()