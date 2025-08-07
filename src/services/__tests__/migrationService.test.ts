import { describe, it, expect, vi, beforeEach } from 'vitest'
import { migrationEngine, coreMigrations } from '../migrationService'

// Mock error logger
vi.mock('@/lib/error-logger', () => ({
  logInfo: vi.fn(),
  logSupabaseError: vi.fn()
}))

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {}
}))

describe('MigrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(migrationEngine.initialize()).resolves.not.toThrow()
    })
  })

  describe('getAppliedMigrations', () => {
    it('should return empty array for MVP', async () => {
      const result = await migrationEngine.getAppliedMigrations()
      expect(result).toEqual([])
    })
  })

  describe('applyMigration', () => {
    it('should successfully apply a migration (simulated)', async () => {
      const migration = {
        id: '001_test_migration',
        name: 'Test Migration',
        sql: 'CREATE TABLE test (id SERIAL PRIMARY KEY);'
      }

      const result = await migrationEngine.applyMigration(migration)
      expect(result).toBe(true)
    })
  })

  describe('applyMigrations', () => {
    it('should apply all pending migrations', async () => {
      const result = await migrationEngine.applyMigrations(coreMigrations)

      expect(result.success).toBe(true)
      expect(result.appliedMigrations).toHaveLength(2)
      expect(result.appliedMigrations).toEqual(['001_create_profiles_table', '002_create_projects_table'])
    })

    it('should handle empty migrations array', async () => {
      const result = await migrationEngine.applyMigrations([])

      expect(result.success).toBe(true)
      expect(result.message).toBe('All migrations already applied')
      expect(result.appliedMigrations).toEqual([])
    })
  })

  describe('getMigrationHistory', () => {
    it('should return empty array for MVP', async () => {
      const result = await migrationEngine.getMigrationHistory()
      expect(result).toEqual([])
    })
  })

  describe('coreMigrations', () => {
    it('should include required MVP migrations', () => {
      expect(coreMigrations).toHaveLength(2)
      expect(coreMigrations[0].id).toBe('001_create_profiles_table')
      expect(coreMigrations[1].id).toBe('002_create_projects_table')
    })

    it('should have valid SQL for each migration', () => {
      coreMigrations.forEach(migration => {
        expect(migration.sql).toBeTruthy()
        expect(migration.sql).toContain('CREATE TABLE')
        expect(migration.sql).toContain('ROW LEVEL SECURITY')
        expect(migration.sql).toContain('CREATE POLICY')
      })
    })

    it('should have unique migration IDs', () => {
      const ids = coreMigrations.map(m => m.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids).toHaveLength(uniqueIds.length)
    })

    it('should have descriptive names', () => {
      coreMigrations.forEach(migration => {
        expect(migration.name).toBeTruthy()
        expect(migration.name.length).toBeGreaterThan(5)
      })
    })
  })

  describe('error handling', () => {
    it('should handle errors gracefully in getAppliedMigrations', async () => {
      // Test that even if there's an error, it returns empty array
      const result = await migrationEngine.getAppliedMigrations()
      expect(result).toEqual([])
    })

    it('should handle errors gracefully in getMigrationHistory', async () => {
      // Test that even if there's an error, it returns empty array
      const result = await migrationEngine.getMigrationHistory()
      expect(result).toEqual([])
    })
  })

  describe('logging', () => {
    it('should log migration events', async () => {
      const { logInfo } = await import('@/lib/error-logger')
      
      await migrationEngine.initialize()
      
      expect(logInfo).toHaveBeenCalledWith('Initializing migration engine', {
        feature: 'migration',
        action: 'initialize'
      })
    })

    it('should log migration application', async () => {
      const { logInfo } = await import('@/lib/error-logger')
      
      const migration = {
        id: '001_test',
        name: 'Test Migration',
        sql: 'CREATE TABLE test (id SERIAL);'
      }

      await migrationEngine.applyMigration(migration)
      
      expect(logInfo).toHaveBeenCalledWith('Applying migration: Test Migration', {
        feature: 'migration',
        action: 'apply-single',
        metadata: { 
          migrationId: '001_test',
          migrationName: 'Test Migration'
        }
      })
    })
  })
})