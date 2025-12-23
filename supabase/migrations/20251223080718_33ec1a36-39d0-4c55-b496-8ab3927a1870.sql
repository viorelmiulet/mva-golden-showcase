-- Drop existing contracts policies
DROP POLICY IF EXISTS "contracts_select" ON storage.objects;
DROP POLICY IF EXISTS "contracts_insert" ON storage.objects;
DROP POLICY IF EXISTS "contracts_update" ON storage.objects;
DROP POLICY IF EXISTS "contracts_delete" ON storage.objects;

-- Create policies for contracts bucket that work for both authenticated and service role
CREATE POLICY "contracts_select_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'contracts');

CREATE POLICY "contracts_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "contracts_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'contracts') WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "contracts_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'contracts');