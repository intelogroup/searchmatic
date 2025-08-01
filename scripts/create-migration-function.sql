-- Create a secure function to run migrations
-- This function can only be called with a service role key
CREATE OR REPLACE FUNCTION run_migration(migration_sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Only allow execution if called with service role
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: This function requires service role access';
    END IF;
    
    -- Execute the migration SQL
    EXECUTE migration_sql;
    
    -- Return success
    result := json_build_object(
        'success', true,
        'message', 'Migration executed successfully',
        'timestamp', now()
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE,
            'timestamp', now()
        );
        RETURN result;
END;
$$;

-- Grant execute permission only to service role
REVOKE ALL ON FUNCTION run_migration(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION run_migration(text) TO service_role;