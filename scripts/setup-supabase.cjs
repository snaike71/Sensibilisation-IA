const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgresql://postgres.omivsuyzedmrthvnpaxa:sensibilisationia@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
})

async function setup() {
  await client.connect()
  console.log('Connecté à Supabase')

  // Ajouter la politique d'accès anon sur la table documents
  // (la politique deny_all existante est permissive, un allow la supplante)
  await client.query(`
    do $$ begin
      if not exists (
        select 1 from pg_policies where tablename = 'documents' and policyname = 'allow_anon'
      ) then
        execute 'create policy "allow_anon" on documents for all to anon using (true) with check (true)';
      end if;
    end $$
  `)
  console.log('Politique accès anon ajoutée sur documents')

  // Créer la fonction de recherche sémantique pour la table documents
  await client.query(`
    create or replace function match_documents(query_embedding vector(768), match_count int)
    returns table(content text, similarity float)
    language sql security definer as $$
      select chunk as content, 1 - (embedding <=> query_embedding) as similarity
      from documents
      order by embedding <=> query_embedding
      limit match_count;
    $$
  `)
  console.log('Fonction match_documents créée')

  await client.end()
  console.log('✅ Supabase adapté au schéma collègue avec succès !')
}

setup().catch((e) => { console.error('❌ Erreur :', e.message); process.exit(1) })
