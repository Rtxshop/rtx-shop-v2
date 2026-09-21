const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadImage(file) {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await db.storage
    .from(BUCKET_NAME)
    .upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = db.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function deleteImage(imageUrl) {
  if (!imageUrl) return;
  const fileName = imageUrl.split('/').pop();
  await db.storage.from(BUCKET_NAME).remove([fileName]);
}

async function getAccounts() {
  const { data, error } = await db
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function addAccount(account) {
  const { data, error } = await db
    .from('accounts')
    .insert([account])
    .select();
  if (error) throw error;
  return data;
}

async function updateAccount(id, account) {
  const { data, error } = await db
    .from('accounts')
    .update(account)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

async function deleteAccount(id) {
  const { error } = await db
    .from('accounts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
