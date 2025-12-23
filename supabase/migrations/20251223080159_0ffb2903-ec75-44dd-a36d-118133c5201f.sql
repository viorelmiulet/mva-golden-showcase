-- Drop duplicate policies for contracts bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload contracts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update contracts storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON storage.objects;

-- Create clean policies for contracts bucket
CREATE POLICY "contracts_select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'contracts');

CREATE POLICY "contracts_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "contracts_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'contracts')
WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "contracts_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'contracts');