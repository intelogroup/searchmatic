import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { migrationEngine, coreMigrations } from '@/services/migrationService'
import { logInfo, logSupabaseError } from '@/lib/error-logger'
import { RefreshCw, Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface MigrationHistoryItem {
  migration_id: string
  migration_name: string
  applied_at: string
  success: boolean
  error_message?: string
}

export const Migrations: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [migrationHistory, setMigrationHistory] = useState<MigrationHistoryItem[]>([])
  const [appliedMigrations, setAppliedMigrations] = useState<string[]>([])
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
    appliedMigrations?: string[]
    failedMigrations?: string[]
  } | null>(null)

  // Load migration data
  const loadMigrationData = async () => {
    try {
      logInfo('Loading migration data', {
        feature: 'migration',
        action: 'load-data'
      })

      const [history, applied] = await Promise.all([
        migrationEngine.getMigrationHistory(),
        migrationEngine.getAppliedMigrations()
      ])

      setMigrationHistory(history)
      setAppliedMigrations(applied)
    } catch (error) {
      logSupabaseError('load-migration-data', error, {
        feature: 'migration',
        action: 'load-data-error'
      })
    }
  }

  // Initialize migration engine
  const handleInitialize = async () => {
    setIsInitializing(true)
    try {
      await migrationEngine.initialize()
      setLastResult({
        success: true,
        message: 'Migration engine initialized successfully'
      })
      await loadMigrationData()
    } catch (error) {
      setLastResult({
        success: false,
        message: `Failed to initialize migration engine: ${String(error)}`
      })
    } finally {
      setIsInitializing(false)
    }
  }

  // Run migrations
  const handleRunMigrations = async () => {
    setIsLoading(true)
    setLastResult(null)

    try {
      logInfo('Starting migration run from UI', {
        feature: 'migration',
        action: 'run-from-ui',
        metadata: {
          totalMigrations: coreMigrations.length
        }
      })

      const result = await migrationEngine.applyMigrations(coreMigrations)
      setLastResult(result)
      
      // Reload data after migrations
      await loadMigrationData()
    } catch (error) {
      setLastResult({
        success: false,
        message: `Migration failed: ${String(error)}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMigrationData()
  }, [])

  const getPendingMigrations = () => {
    return coreMigrations.filter(m => !appliedMigrations.includes(m.id))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Database Migrations</h1>
          <p className="text-muted-foreground">
            Manage and apply versioned database schema migrations
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={handleInitialize}
            disabled={isInitializing}
            variant="outline"
          >
            {isInitializing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Initialize Engine
              </>
            )}
          </Button>

          <Button
            onClick={handleRunMigrations}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Migrations...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Migrations
              </>
            )}
          </Button>

          <Button
            onClick={loadMigrationData}
            variant="ghost"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Last Result */}
        {lastResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Migration Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`mb-2 ${lastResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {lastResult.message}
              </p>
              {lastResult.appliedMigrations && lastResult.appliedMigrations.length > 0 && (
                <div className="mb-2">
                  <strong>Applied:</strong> {lastResult.appliedMigrations.join(', ')}
                </div>
              )}
              {lastResult.failedMigrations && lastResult.failedMigrations.length > 0 && (
                <div>
                  <strong>Failed:</strong> {lastResult.failedMigrations.join(', ')}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Migrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Migrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coreMigrations.map((migration) => {
                  const isApplied = appliedMigrations.includes(migration.id)
                  
                  return (
                    <div
                      key={migration.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {migration.id}
                          </code>
                          <Badge variant={isApplied ? "default" : "secondary"}>
                            {isApplied ? "Applied" : "Pending"}
                          </Badge>
                        </div>
                        <h4 className="font-medium">{migration.name}</h4>
                      </div>
                      <div className="ml-4">
                        {isApplied ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {getPendingMigrations().length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>{getPendingMigrations().length} pending migrations</strong> need to be applied.
                  </p>
                </div>
              )}

              {getPendingMigrations().length === 0 && appliedMigrations.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>All migrations applied!</strong> Database is up to date.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Migration History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Migration History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {migrationHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No migrations have been run yet.
                  <br />
                  Initialize the migration engine to get started.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {migrationHistory.map((item, index) => (
                    <div
                      key={`${item.migration_id}-${index}`}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {item.migration_id}
                          </code>
                          <Badge variant={item.success ? "default" : "destructive"}>
                            {item.success ? "Success" : "Failed"}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm mb-1">{item.migration_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.applied_at).toLocaleString()}
                        </p>
                        {item.error_message && (
                          <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                            {item.error_message}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {item.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}