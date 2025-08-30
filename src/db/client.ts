import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Create the connection with session pooler settings (working configuration)
export const client = postgres({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.qzvfufadiqmizrozejci',
  password: 'Goldyear2023#$25',
  ssl: 'require',
  prepare: false, // Required for pooled connections
  max: 10 // Connection pool size
})

// Create the drizzle instance with schema
export const db = drizzle(client, { schema })

// Export schema for convenience
export { schema }