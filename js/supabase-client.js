const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== تولید اسم فایل امن (بدون تغییر اسم اصلی) =====
function generateSafeFileName(originalName) {
  const dotIndex = originalName.lastIndexOf('.');
  const name = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
  const ext = dotIndex !== -1 ? originalName.substring(dotIndex + 1) : 'jpg';

  // حذف کاراکترهای غیرمجاز (فقط / و \ و : و * و ? و " و < و > و | ممنوعن)
  const safeName = name
    .replace(/[\/\\:*?"<>|]/g, '_')
    .trim() || 'image';

  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';

  // اضافه کردن timestamp برای یکتا بودن
  return `${safeName}-${Date.now()}.${safeExt}`;
}

// ===== آپلود عکس =====
async function uploadImage(file) {
  const fileName = generateSafeFileName(file.name);
  const { data, error } = await db.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      upsert: false,
      contentType: file.type
    });
  if (error) throw error;
  const { data: urlData } = db.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);
  return urlData.publicUrl;
}

// ===== حذف عکس =====
async function deleteImage(imageUrl) {
  if (!imageUrl) return;
  try {
    const parts = imageUrl.split('/');
    const fileName = parts[parts.length - 1].split('?')[0];
    await db.storage.from(BUCKET_NAME).remove([fileName]);
  } catch (e) { console.warn('حذف عکس ناموفق:', e); }
}

// ===== گرفتن همه اکانت‌ها =====
async function getAccounts() {
  const { data, error } = await db
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ===== افزودن اکانت =====
async function addAccount(account) {
  const { data, error } = await db
    .from('accounts')
    .insert([account])
    .select();
  if (error) throw error;
  return data;
}

// ===== ویرایش اکانت =====
async function updateAccount(id, account) {
  const { data, error } = await db
    .from('accounts')
    .update(account)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

// ===== حذف اکانت =====
async function deleteAccount(id) {
  const { error } = await db
    .from('accounts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
