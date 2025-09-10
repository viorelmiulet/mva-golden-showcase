-- Create a sample API key for the user
INSERT INTO api_keys (key_name, description, api_key)
VALUES (
  'Client Principal',
  'API key pentru platforma principală - acces complet la oferte și proiecte',
  'mva_' || encode(gen_random_bytes(24), 'base64')
);