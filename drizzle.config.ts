import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Extract connection details from Supabase URL
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
const projectRef = urlMatch ? urlMatch[1] : ''

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Use direct connection string for Drizzle
    url: `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || ''}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
  },
  verbose: true,
  strict: true,
})