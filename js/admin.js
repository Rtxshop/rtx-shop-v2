// ===== بررسی لاگین =====
if (sessionStorage.getItem('rtx_admin') !== 'true') {
  window.location.href = 'index.html';
}

// ===== خروج =====
function logout() {
  sessionStorage.removeItem('rtx_admin');
  window.location.href = 'index.html';
}

// ===== تغییر تب =====
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.getElementById('tab-add').classList.toggle('hidden', target !== 'add');
    document.getElementById('tab-list').classList.toggle('hidden', target !== 'list');
    if (target === 'list') loadAccountsList();
  });
});

// ===== پیش‌نمایش عکس =====
function previewImg(input, targetId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById(targetId || 'previewImg');
    img.src = e.target.result;
    img.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// ===== نمایش پیام =====
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + type;
  setTimeout(() => { el.className = 'msg'; }, 4000);
}

// ===== آمار =====
async function updateStats() {
  try {
    const accounts = await getAccounts();
    document.getElementById('statTotal').textContent = accounts.length;
    document.getElementById('statAvailable').textContent = accounts.filter(a => a.status === 'available').length;
    document.getElementById('statSold').textContent = accounts.filter(a => a.status === 'sold').length;
  } catch (e) { console.warn('آمار لود نشد:', e); }
}

// ===== ثبت اکانت جدید =====
document.getElementById('accountForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ در حال ثبت...';

  try {
    const imageFile = document.getElementById('fImage').files[0];
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const account = {
      title: document.getElementById('fTitle').value.trim(),
      tagline: document.getElementById('fTagline').value.trim(),
      townhall: parseInt(document.getElementById('fTownhall').value) || null,
      builder: parseInt(document.getElementById('fBuilder').value) || null,
      name_change: parseInt(document.getElementById('fNameChange').value) || null,
      price: parseInt(document.getElementById('fPrice').value),
      code: document.getElementById('fCode').value.trim(),
      description: document.getElementById('fDescription').value.trim(),
      status: document.getElementById('fStatus').value,
      image_url: imageUrl
    };

    await addAccount(account);

    showMsg('addMsg', '✅ اکانت با موفقیت ثبت شد!', 'success');
    document.getElementById('accountForm').reset();
    document.getElementById('previewImg').classList.add('hidden');
    updateStats();
  } catch (err) {
    console.error(err);
    showMsg('addMsg', '❌ خطا: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🚀 ثبت اکانت';
  }
});

// ===== بارگذاری لیست اکانت‌ها =====
async function loadAccountsList() {
  const list = document.getElementById('accountsList');
  list.innerHTML = 'در حال بارگذاری...';
  try {
    const accounts = await getAccounts();
    updateStats();
    if (accounts.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#94A3B8;padding:30px;">هنوز اکانتی ثبت نشده</p>';
      return;
    }
    list.innerHTML = accounts.map(acc => `
      <div class="account-row">
        ${acc.image_url
          ? `<img src="${acc.image_url}" alt="${acc.title}">`
          : `<div class="no-img">🎮</div>`}
        <div class="info">
          <h3>${acc.title}</h3>
          <div class="meta">
            <span class="badge">کد ${acc.code}</span>
            <span class="badge">${acc.price.toLocaleString('fa-IR')} تومان</span>
            <span class="badge">تاون ${acc.townhall || '-'}</span>
            ${acc.status === 'available'
              ? '<span class="badge" style="background:rgba(0,255,136,0.15);color:#00FF88;border-color:rgba(0,255,136,0.3);">✅ موجود</span>'
              : '<span class="badge" style="background:rgba(255,46,136,0.15);color:#FF2E88;border-color:rgba(255,46,136,0.3);">❌ فروش رفته</span>'}
          </div>
        </div>
        <div class="account-actions">
          <button onclick="toggleStatus('${acc.id}', '${acc.status}')" title="تغییر وضعیت">🔄</button>
          <button onclick="openEditModal('${acc.id}')" style="background:rgba(0,217,255,0.1);color:#00D9FF;border-color:rgba(0,217,255,0.3);" title="ویرایش">✏️</button>
          <button onclick="removeAccount('${acc.id}', '${acc.image_url || ''}')" title="حذف">🗑</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p style="color:#FF2E88;">خطا در بارگذاری: ' + err.message + '</p>';
  }
}

// ===== حذف اکانت =====
async function removeAccount(id, imageUrl) {
  if (!confirm('مطمئنی می‌خوای این اکانت رو حذف کنی؟')) return;
  try {
    if (imageUrl) await deleteImage(imageUrl);
    await deleteAccount(id);
    loadAccountsList();
  } catch (err) {
    alert('خطا در حذف: ' + err.message);
  }
}

// ===== تغییر وضعیت سریع =====
async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === 'available' ? 'sold' : 'available';
  try {
    await updateAccount(id, { status: newStatus });
    loadAccountsList();
  } catch (err) {
    alert('خطا: ' + err.message);
  }
}

// ===== باز کردن مودال ویرایش =====
let editingId = null;
let editingOldImage = null;

async function openEditModal(id) {
  try {
    const accounts = await getAccounts();
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;

    editingId = acc.id;
    editingOldImage = acc.image_url;

    document.getElementById('efTitle').value = acc.title || '';
    document.getElementById('efTagline').value = acc.tagline || '';
    document.getElementById('efTownhall').value = acc.townhall || '';
    document.getElementById('efBuilder').value = acc.builder || '';
    document.getElementById('efNameChange').value = acc.name_change || '';
    document.getElementById('efPrice').value = acc.price || '';
    document.getElementById('efCode').value = acc.code || '';
    document.getElementById('efDescription').value = acc.description || '';
    document.getElementById('efStatus').value = acc.status || 'available';

    const preview = document.getElementById('editPreviewImg');
    if (acc.image_url) {
      preview.src = acc.image_url;
      preview.classList.remove('hidden');
    } else {
      preview.classList.add('hidden');
    }

    document.getElementById('editModal').classList.add('active');
    document.getElementById('editMsg').className = 'msg';
    document.getElementById('efImage').value = '';
  } catch (err) {
    alert('خطا: ' + err.message);
  }
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
  editingId = null;
  editingOldImage = null;
}

// ===== ذخیره ویرایش =====
document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('editSubmitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ در حال ذخیره...';

  try {
    const imageFile = document.getElementById('efImage').files[0];
    let imageUrl = editingOldImage;

    if (imageFile) {
      if (editingOldImage) await deleteImage(editingOldImage);
      imageUrl = await uploadImage(imageFile);
    }

    const updates = {
      title: document.getElementById('efTitle').value.trim(),
      tagline: document.getElementById('efTagline').value.trim(),
      townhall: parseInt(document.getElementById('efTownhall').value) || null,
      builder: parseInt(document.getElementById('efBuilder').value) || null,
      name_change: parseInt(document.getElementById('efNameChange').value) || null,
      price: parseInt(document.getElementById('efPrice').value),
      code: document.getElementById('efCode').value.trim(),
      description: document.getElementById('efDescription').value.trim(),
      status: document.getElementById('efStatus').value,
      image_url: imageUrl
    };

    await updateAccount(editingId, updates);

    showMsg('editMsg', '✅ تغییرات ذخیره شد!', 'success');
    setTimeout(() => {
      closeEditModal();
      loadAccountsList();
    }, 800);
  } catch (err) {
    showMsg('editMsg', '❌ خطا: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 ذخیره تغییرات';
  }
});

// ===== شروع =====
updateStats();
