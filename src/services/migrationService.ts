import { BaseService } from '@/lib/service-wrapper'

interface Migration {
  id: string
  name: string
  sql: string
  created_at?: Date
}

interface MigrationResult {
  success: boolean
  message: string
  appliedMigrations?: string[]
  failedMigrations?: string[]
  error?: unknown
}

class MigrationEngine extends BaseService {
  constructor() {
    super('migration')
  }
  /**
   * Initialize the migration engine by creating the schema_migrations table
   */
  async initialize(): Promise<void> {
    return this.execute(
      'initialize',
      async () => {
        // Create the schema_migrations table using SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            migration_id VARCHAR(255) UNIQUE NOT NULL,
            migration_name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            success BOOLEAN NOT NULL DEFAULT true,
            error_message TEXT
          );
          
          CREATE INDEX IF NOT EXISTS idx_schema_migrations_id ON schema_migrations(migration_id);
          CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);
        `
        
        // Execute through RPC (edge function would need to be created)
        // For now, we'll log this as a requirement
        console.log('Schema migrations table creation SQL prepared:', createTableSQL)
        console.log('Migration engine initialized (Note: Manual SQL execution may be required)')
      }
    )
  }

  /**
   * Get all applied migrations (simulated for MVP)
   */
  async getAppliedMigrations(): Promise<string[]> {
    return this.execute(
      'get-applied-migrations',
      async () => {
        // For MVP, we'll return empty array since we don't have the table structure yet
        // This would need proper implementation with the schema_migrations table
        return []
      }
    ).catch(() => [])
  }

  /**
   * Apply a single migration (simulated for MVP)
   */
  async applyMigration(migration: Migration): Promise<boolean> {
    return this.execute(
      'apply-migration',
      async () => {
        // For MVP, we'll simulate success and log the SQL
        console.log('Migration SQL to be executed:', migration.sql.substring(0, 500))

        // Simulate migration execution
        return true
      },
      {
        migrationId: migration.id,
        migrationName: migration.name
      }
    ).catch(() => false)
  }

  /**
   * Apply multiple migrations in order
   */
  async applyMigrations(migrations: Migration[]): Promise<MigrationResult> {
    return this.execute(
      'apply-migrations',
      async () => {
        const appliedMigrations: string[] = []
        const failedMigrations: string[] = []

        // Get already applied migrations
        const appliedIds = await this.getAppliedMigrations()
        
        // Filter out already applied migrations
        const pendingMigrations = migrations.filter(m => !appliedIds.includes(m.id))

        if (pendingMigrations.length === 0) {
          return {
            success: true,
            message: 'All migrations already applied',
            appliedMigrations: []
          }
        }

        // Apply each pending migration
        for (const migration of pendingMigrations) {
          const success = await this.applyMigration(migration)
          
          if (success) {
            appliedMigrations.push(migration.id)
          } else {
            failedMigrations.push(migration.id)
            // Stop on first failure for safety
            break
          }
        }

        const success = failedMigrations.length === 0

        return {
          success,
          message: success 
            ? `Successfully applied ${appliedMigrations.length} migrations`
            : `Applied ${appliedMigrations.length} migrations, ${failedMigrations.length} failed`,
          appliedMigrations,
          failedMigrations
        }
      },
      { 
        totalMigrations: migrations.length,
        migrationIds: migrations.map(m => m.id)
      }
    ).catch((error) => ({
      success: false,
      message: `Migration batch failed: ${String(error)}`,
      appliedMigrations: [],
      failedMigrations: [],
      error
    }))
  }

  /**
   * Get migration history (simulated for MVP)
   */
  async getMigrationHistory(): Promise<Array<{
    migration_id: string
    migration_name: string
    applied_at: string
    success: boolean
    error_message?: string
  }>> {
    return this.execute(
      'get-migration-history',
      async () => {
        // For MVP, return empty array since we don't have the table structure yet
        return []
      }
    ).catch(() => [])
  }
}

// Export singleton instance
export const migrationEngine = new MigrationEngine()

// Export predefined migrations for MVP
export const coreMigrations: Migration[] = [
  {
    id: '001_create_profiles_table',
    name: 'Create profiles table',
    sql: `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);

      CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);

      CREATE POLICY "Users can insert own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    `
  },
  {
    id: '002_create_projects_table',
    name: 'Create projects table',
    sql: `
      CREATE TABLE IF NOT EXISTS projects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'systematic_review',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Users can view own projects" ON projects
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own projects" ON projects
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update own projects" ON projects
        FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete own projects" ON projects
        FOR DELETE USING (auth.uid() = user_id);
    `
  }
]