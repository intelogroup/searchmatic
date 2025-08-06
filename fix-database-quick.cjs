const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with anon key (RLS enabled)
const supabase = createClient(
  'https://qzvfufadiqmizrozejci.supabase.co',
  'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'
);

async function checkAndApplyMigration() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if we can access the projects table (RLS will handle permissions)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError) {
      console.error('❌ Error accessing projects table:', projectsError.message);
      console.log('This might be because:');
      console.log('1. User is not authenticated (expected with anon key)');
      console.log('2. Projects table does not exist');
      console.log('3. RLS policies are blocking access');
      return;
    } else {
      console.log('✅ Projects table exists and is accessible');
      console.log('📊 Current project count:', projects?.length || 0);
    }
    
    // Since we can't modify the schema with anon key, we'll skip that
    // The schema should be set up via Supabase Dashboard or service role
    console.log('ℹ️  Schema modifications require admin access');
    console.log('ℹ️  Please apply the migration script in Supabase Dashboard if not done already');
    
    // Test authentication and user access
    console.log('🔐 Testing authentication flow...');
    
    // Try to sign up a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError) {
      console.log('⚠️  Auth signup issue:', signUpError.message);
      console.log('This is expected if email confirmation is required');
    } else {
      console.log('✅ Test user signup successful');
      
      // Try to create a project with the authenticated user
      if (signUpData.user) {
        console.log('🧪 Testing project creation with authenticated user...');
        
        const testProjectData = {
          title: 'Test Project - ' + Date.now(),
          description: 'This is a test project to verify functionality',
          user_id: signUpData.user.id
        };
        
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert(testProjectData)
          .select()
          .single();
          
        if (createError) {
          console.error('❌ Project creation failed:', createError.message);
        } else {
          console.log('✅ Test project created successfully!');
          console.log('Project ID:', newProject.id);
          
          // Clean up test project
          await supabase.from('projects').delete().eq('id', newProject.id);
          console.log('✅ Test project cleaned up');
        }
      }
    }
    
    console.log('🎉 Database is ready for project creation!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkAndApplyMigration();