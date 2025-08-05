/**
 * VCT SchemaAgent - Manages Supabase schema operations
 * Fetches and caches schema information, ensures query safety
 */

import { VCTAgent } from './base/VCTAgent';
import { createClient } from '@supabase/supabase-js';

interface SchemaInfo {
  tables: TableInfo[];
  views: ViewInfo[];
  functions: FunctionInfo[];
  enums: EnumInfo[];
  policies: PolicyInfo[];
  lastUpdated: string;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primaryKey: string[];
  foreignKeys: ForeignKeyInfo[];
  indexes: IndexInfo[];
  policies: string[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  description?: string;
}

interface ViewInfo {
  name: string;
  definition: string;
  columns: ColumnInfo[];
}

interface FunctionInfo {
  name: string;
  arguments: string[];
  returnType: string;
  language: string;
}

interface EnumInfo {
  name: string;
  values: string[];
}

interface PolicyInfo {
  tableName: string;
  policyName: string;
  command: string;
  role: string;
  expression: string;
}

interface ForeignKeyInfo {
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}

export class SchemaAgent extends VCTAgent {
  private supabase: any;
  private schemaCache: SchemaInfo | null = null;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheTime: number = 0;

  constructor() {
    super('SchemaAgent');
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client with admin privileges for schema access
   */
  private initializeSupabase(): void {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    if (!serviceKey) {
      this.log('Warning: Service role key not available, using anon key');
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
      this.supabase = createClient(supabaseUrl, anonKey!);
    } else {
      this.supabase = createClient(supabaseUrl, serviceKey);
    }
  }

  /**
   * Get current database schema with caching
   */
  async getCurrentSchema(): Promise<SchemaInfo> {
    return this.measureTime('getCurrentSchema', async () => {
      if (this.isCacheValid()) {
        this.log('Returning cached schema');
        return this.schemaCache!;
      }

      this.log('Fetching fresh schema from database');
      const schema = await this.fetchSchemaFromDatabase();
      
      this.schemaCache = schema;
      this.lastCacheTime = Date.now();
      
      return schema;
    });
  }

  /**
   * Get detailed information about a specific table
   */
  async getTableInfo(tableName: string): Promise<TableInfo | null> {
    return this.measureTime(`getTableInfo:${tableName}`, async () => {
      const schema = await this.getCurrentSchema();
      const table = schema.tables.find(t => t.name === tableName);
      
      if (!table) {
        this.log(`Table '${tableName}' not found in schema`);
        return null;
      }

      this.log(`Retrieved table info for '${tableName}'`, { 
        columns: table.columns.length,
        policies: table.policies.length 
      });
      
      return table;
    });
  }

  /**
   * Validate query safety against RLS policies
   */
  async validateQuery(query: string, tableName: string): Promise<ValidationResult> {
    return this.measureTime(`validateQuery:${tableName}`, async () => {
      const tableInfo = await this.getTableInfo(tableName);
      
      if (!tableInfo) {
        return {
          valid: false,
          errors: [`Table '${tableName}' not found`],
          warnings: []
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for RLS bypass attempts
      if (query.toLowerCase().includes('disable row level security')) {
        errors.push('Attempt to disable RLS detected');
      }

      // Check for dangerous operations
      if (query.toLowerCase().includes('drop table')) {
        errors.push('DROP TABLE operations not allowed');
      }

      // Check column existence
      const referencedColumns = this.extractColumnsFromQuery(query);
      for (const column of referencedColumns) {
        if (!tableInfo.columns.some(c => c.name === column)) {
          errors.push(`Column '${column}' does not exist in table '${tableName}'`);
        }
      }

      // Check if table has RLS policies
      if (tableInfo.policies.length === 0) {
        warnings.push(`Table '${tableName}' has no RLS policies - data may be exposed`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    });
  }

  /**
   * Generate TypeScript types from schema
   */
  async generateTypeScript(): Promise<string> {
    return this.measureTime('generateTypeScript', async () => {
      const schema = await this.getCurrentSchema();
      let typescript = '// Generated TypeScript types from Supabase schema\n\n';

      // Generate enum types
      for (const enumInfo of schema.enums) {
        typescript += `export type ${this.toPascalCase(enumInfo.name)} = ${enumInfo.values.map(v => `'${v}'`).join(' | ')};\n\n`;
      }

      // Generate table types
      for (const table of schema.tables) {
        const typeName = this.toPascalCase(table.name);
        typescript += `export interface ${typeName} {\n`;
        
        for (const column of table.columns) {
          const optional = column.nullable ? '?' : '';
          const type = this.mapPostgresToTypeScript(column.type);
          typescript += `  ${column.name}${optional}: ${type};\n`;
        }
        
        typescript += '}\n\n';
      }

      this.log('Generated TypeScript types', { 
        tables: schema.tables.length,
        enums: schema.enums.length 
      });

      return typescript;
    });
  }

  /**
   * Fetch complete schema information from database
   */
  private async fetchSchemaFromDatabase(): Promise<SchemaInfo> {
    const [tables, views, functions, enums, policies] = await Promise.all([
      this.fetchTables(),
      this.fetchViews(),
      this.fetchFunctions(),
      this.fetchEnums(),
      this.fetchPolicies()
    ]);

    return {
      tables,
      views,
      functions,
      enums,
      policies,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Fetch table information
   */
  private async fetchTables(): Promise<TableInfo[]> {
    const { data: tables, error } = await this.supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_type', 'VIEW');

    if (error) {
      this.logError('Failed to fetch tables', error);
      return [];
    }

    const tableInfos: TableInfo[] = [];
    
    for (const table of tables) {
      const tableInfo = await this.fetchTableDetails(table.table_name);
      if (tableInfo) {
        tableInfos.push(tableInfo);
      }
    }

    return tableInfos;
  }

  /**
   * Fetch detailed information for a specific table
   */
  private async fetchTableDetails(tableName: string): Promise<TableInfo | null> {
    try {
      const [columns, constraints, indexes] = await Promise.all([
        this.fetchTableColumns(tableName),
        this.fetchTableConstraints(tableName),
        this.fetchTableIndexes(tableName)
      ]);

      const primaryKey = constraints
        .filter(c => c.constraint_type === 'PRIMARY KEY')
        .map(c => c.column_name);

      const foreignKeys = constraints
        .filter(c => c.constraint_type === 'FOREIGN KEY')
        .map(c => ({
          column: c.column_name,
          referencedTable: c.referenced_table_name,
          referencedColumn: c.referenced_column_name
        }));

      return {
        name: tableName,
        columns,
        primaryKey,
        foreignKeys,
        indexes,
        policies: [] // Will be populated by fetchPolicies
      };
    } catch (error) {
      this.logError(`Failed to fetch details for table ${tableName}`, error);
      return null;
    }
  }

  /**
   * Fetch column information for a table
   */
  private async fetchTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const { data, error } = await this.supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      this.logError(`Failed to fetch columns for ${tableName}`, error);
      return [];
    }

    return data.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      default: col.column_default
    }));
  }

  /**
   * Fetch views information
   */
  private async fetchViews(): Promise<ViewInfo[]> {
    // Implementation for fetching views
    return [];
  }

  /**
   * Fetch functions information
   */
  private async fetchFunctions(): Promise<FunctionInfo[]> {
    // Implementation for fetching functions
    return [];
  }

  /**
   * Fetch enums information
   */
  private async fetchEnums(): Promise<EnumInfo[]> {
    // Implementation for fetching enums
    return [];
  }

  /**
   * Fetch RLS policies
   */
  private async fetchPolicies(): Promise<PolicyInfo[]> {
    // Implementation for fetching RLS policies
    return [];
  }

  /**
   * Fetch table constraints
   */
  private async fetchTableConstraints(tableName: string): Promise<any[]> {
    // Implementation for fetching constraints
    return [];
  }

  /**
   * Fetch table indexes
   */
  private async fetchTableIndexes(tableName: string): Promise<IndexInfo[]> {
    // Implementation for fetching indexes
    return [];
  }

  /**
   * Helper methods
   */
  private isCacheValid(): boolean {
    return !!this.schemaCache && 
           (Date.now() - this.lastCacheTime) < this.cacheExpiry;
  }

  private extractColumnsFromQuery(query: string): string[] {
    // Simple regex to extract column names - could be more sophisticated
    const matches = query.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    return [...new Set(matches)];
  }

  private toPascalCase(str: string): string {
    return str.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private mapPostgresToTypeScript(pgType: string): string {
    const typeMap: { [key: string]: string } = {
      'text': 'string',
      'varchar': 'string',
      'char': 'string',
      'uuid': 'string',
      'integer': 'number',
      'bigint': 'number',
      'numeric': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'timestamp': 'string',
      'timestamptz': 'string',
      'date': 'string',
      'jsonb': 'any',
      'json': 'any'
    };

    return typeMap[pgType.toLowerCase()] || 'any';
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}