import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function findValidValues() {
  console.log('🔍 Finding valid enum values by testing...')
  
  try {
    // Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'jayveedz19@gmail.com',
      password: 'Jimkali90#'
    })
    
    if (authError) {
      console.error('❌ Auth failed:', authError.message)
      return
    }
    
    const userId = authData.user.id
    
    // Test different status values
    const statusValues = ['draft', 'active', 'completed', 'in_progress', 'pending', 'archived']
    const typeValues = ['review', 'research', 'project', 'meta_analysis', 'systematic', 'scoping']
    
    console.log('\n🧪 Testing status values...')
    for (const status of statusValues) {
      try {
        const { error } = await supabase
          .from('projects')
          .insert([{
            title: `Test Status: ${status}`,
            description: 'Test',
            user_id: userId,
            status: status,
            type: 'review'  // Try a simple type
          }])
          .select()
        
        if (error) {
          console.log(`❌ ${status}: ${error.message.substring(0, 50)}...`)
        } else {
          console.log(`✅ ${status}: Works!`)
        }
      } catch (err) {
        console.log(`❌ ${status}: ${err.message.substring(0, 50)}...`)
      }
    }
    
    console.log('\n🧪 Testing type values...')
    for (const type of typeValues) {
      try {
        const { error } = await supabase
          .from('projects')
          .insert([{
            title: `Test Type: ${type}`,
            description: 'Test',
            user_id: userId,
            status: 'completed',  // Use a status we know works
            type: type
          }])
          .select()
        
        if (error) {
          console.log(`❌ ${type}: ${error.message.substring(0, 50)}...`)
        } else {
          console.log(`✅ ${type}: Works!`)
        }
      } catch (err) {
        console.log(`❌ ${type}: ${err.message.substring(0, 50)}...`)
      }
    }
    
    // Clean up test projects
    await supabase
      .from('projects')
      .delete()
      .ilike('title', 'Test %')
      
    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

findValidValues()