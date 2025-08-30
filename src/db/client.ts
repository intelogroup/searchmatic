import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Get connection string from environment
// For Supabase, we need to use the pooler connection with proper settings
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'qzvfufadiqmizrozejci'

// Use the pooler connection string for Drizzle
// Note: You'll need to get the database password from Supabase dashboard
const DATABASE_URL = process.env.DATABASE_URL || 
  `postgresql://postgres.${projectRef}:[YOUR-DB-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

// Create the connection with transaction pool mode settings
export const client = postgres(DATABASE_URL, { 
  prepare: false // Required for transaction pool mode
})

// Create the drizzle instance with schema
export const db = drizzle(client, { schema })

// Export schema for convenience
export { schema }