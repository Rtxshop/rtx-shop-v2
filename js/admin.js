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
function previewImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById('previewImg');
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
  } catch (err) {
    console.error(err);
    showMsg('addMsg', '❌ خطا: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 ثبت اکانت';
  }
});

// ===== بارگذاری لیست اکانت‌ها =====
async function loadAccountsList() {
  const list = document.getElementById('accountsList');
  list.innerHTML = 'در حال بارگذاری...';
  try {
    const accounts = await getAccounts();
    if (accounts.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#94A3B8;">هنوز اکانتی ثبت نشده</p>';
      return;
    }
    list.innerHTML = accounts.map(acc => `
      <div class="account-row">
        ${acc.image_url
          ? `<img src="${acc.image_url}" alt="${acc.title}">`
          : `<div style="width:60px;height:60px;background:#252540;border-radius:8px;display:flex;align-items:center;justify-content:center;">🎮</div>`}
        <div class="info">
          <h3>${acc.title}</h3>
          <div class="meta">
            کد: ${acc.code} |
            قیمت: ${acc.price} |
            تاون: ${acc.townhall || '-'} |
            ${acc.status === 'available' ? '✅ موجود' : '❌ فروش رفته'}
          </div>
        </div>
        <div class="account-actions">
          <button class="btn-del" onclick="removeAccount('${acc.id}', '${acc.image_url || ''}')">🗑 حذف</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p style="color:#FF8A8A;">خطا در بارگذاری: ' + err.message + '</p>';
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
