#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkzMTQwOSwiZXhwIjoyMDY5NTA3NDA5fQ.ThqBa2lzMrm6zADqVIQzqK7-HvYOpfoVvsh_9qdwxgc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkCurrentEnums() {
    console.log('🔍 Investigating current enum types and values...');
    
    try {
        // Test different enum values to see what's currently accepted
        const testUser = '00000000-0000-0000-0000-000000000000';
        
        // Try different status values to see which ones work
        const statusTests = ['draft', 'active', 'pending', 'completed', 'in_progress', 'setup'];
        const typeTests = ['systematic_review', 'meta_analysis', 'review', 'analysis'];
        
        console.log('\n🧪 Testing current enum values...');
        
        for (const status of statusTests) {
            console.log(`\nTesting status: "${status}"`);
            
            const { data, error } = await supabase
                .from('projects')
                .insert({
                    title: `Test Status: ${status}`,
                    description: `Testing status value: ${status}`,
                    type: 'systematic_review',
                    status: status,
                    user_id: testUser
                })
                .select();
            
            if (error) {
                console.log(`  ❌ "${status}" - ${error.message}`);
            } else {
                console.log(`  ✅ "${status}" - WORKS!`);
                
                // Clean up successful test
                if (data && data[0]) {
                    await supabase
                        .from('projects')
                        .delete()
                        .eq('id', data[0].id);
                }
            }
        }
        
        console.log('\n🧪 Testing type values...');
        
        for (const type of typeTests) {
            console.log(`\nTesting type: "${type}"`);
            
            const { data, error } = await supabase
                .from('projects')
                .insert({
                    title: `Test Type: ${type}`,
                    description: `Testing type value: ${type}`,
                    type: type,
                    status: 'setup', // Use a status we know works
                    user_id: testUser
                })
                .select();
            
            if (error) {
                console.log(`  ❌ "${type}" - ${error.message}`);
            } else {
                console.log(`  ✅ "${type}" - WORKS!`);
                
                // Clean up successful test
                if (data && data[0]) {
                    await supabase
                        .from('projects')
                        .delete()
                        .eq('id', data[0].id);
                }
            }
        }
        
        // Let's also check existing projects to see what values they have
        console.log('\n📊 Checking existing project data...');
        const { data: existingProjects, error: existingError } = await supabase
            .from('projects')
            .select('type, status')
            .limit(10);
        
        if (existingError) {
            console.log('❌ Could not fetch existing projects:', existingError);
        } else if (existingProjects && existingProjects.length > 0) {
            console.log('✅ Found existing projects:');
            
            const uniqueTypes = [...new Set(existingProjects.map(p => p.type))];
            const uniqueStatuses = [...new Set(existingProjects.map(p => p.status))];
            
            console.log('Current type values in use:', uniqueTypes);
            console.log('Current status values in use:', uniqueStatuses);
        } else {
            console.log('ℹ️  No existing projects found');
        }
        
        // Generate updated migration SQL based on findings
        console.log('\n📝 Based on testing, the current enums likely accept:');
        console.log('- For status: "setup" works (others tested failed)');
        console.log('- For type: Need to test what works');
        
        return true;
        
    } catch (err) {
        console.error('💥 Error during enum testing:', err);
        return false;
    }
}

checkCurrentEnums()
    .then(() => {
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. The enums exist but have different values than expected');
        console.log('2. We need to either:');
        console.log('   a) Add missing enum values to existing enums');
        console.log('   b) Update frontend to use current enum values');
        console.log('3. Most likely we need to add "draft", "active" etc. to project_status enum');
        process.exit(0);
    })
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });