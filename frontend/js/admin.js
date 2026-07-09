const API_URL = '/api';
const BASE_URL = '';

document.addEventListener('DOMContentLoaded', () => {
    // التحقق من صلاحيات الأدمن
    const currentUser = JSON.parse(localStorage.getItem('alhayat_currentUser'));
    const token = localStorage.getItem('alhayat_token');

    if (!currentUser || currentUser.role !== 'admin' || !token) {
        Swal.fire({
            icon: 'error',
            title: 'غير مصرح',
            text: 'عفواً، هذه الصفحة مخصصة للإدارة فقط.',
            confirmButtonColor: '#0E5E6F'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }

    const adminWelcome = document.getElementById('adminWelcome');
    if (adminWelcome) {
        adminWelcome.textContent = `مرحباً بك، ${currentUser.name}`;
    }

    // تسجيل الخروج
    const adminLogout = document.getElementById('adminLogout');
    if (adminLogout) {
        adminLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('alhayat_currentUser');
            localStorage.removeItem('alhayat_token');
            window.location.href = 'login.html';
        });
    }

    // جلب البيانات الأساسية
    loadDashboardStats();
    loadBookings();
    updateBookingsBadge();

    // تحديث الإشعارات كل 10 ثواني
    setInterval(updateBookingsBadge, 10000);
});

// ==========================================
// دالة مساعدة للاتصال بالـ API
// ==========================================
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('alhayat_token');
    
    const defaultHeaders = {
        'Authorization': `Bearer ${token}`
    };

    // لا تضف Content-Type إذا كان الـ body عبارة عن FormData (الصور)
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'حدث خطأ في الخادم');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==========================================
// قسم الحجوزات
// ==========================================
async function updateBookingsBadge() {
    try {
        const data = await fetchAPI('/bookings');
        const pendingCount = data.data.filter(b => b.status === 'pending').length;
        const badge = document.getElementById('bookingsBadge');
        if (!badge) return;

        if (pendingCount > 0) {
            badge.textContent = pendingCount > 99 ? '99+' : pendingCount;
            badge.style.cssText = 'display: inline-flex; align-items: center; justify-content: center;';
        } else {
            badge.style.cssText = 'display: none;';
        }
    } catch (err) {
        console.error('Failed to update badge');
    }
}

window.loadBookings = async function() {
    try {
        const data = await fetchAPI('/bookings');
        const bookings = data.data.reverse(); // الأحدث أولاً
        const tableBody = document.getElementById('bookingsTableBody');
        
        if (!tableBody) return;

        if (bookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px;">لا توجد حجوزات حالياً</td></tr>';
            return;
        }

        tableBody.innerHTML = bookings.map(booking => {
            let statusBadge = '';
            let actions = '';

            if (booking.status === 'pending') {
                statusBadge = '<span class="badge pending">قيد المراجعة</span>';
                actions = `
                    <div class="actions-container">
                        <button class="btn-approve" onclick="updateBookingStatus('${booking._id}', 'confirmed')"><i class="fa-solid fa-check"></i> موافقة</button>
                        <button class="btn-reject" onclick="updateBookingStatus('${booking._id}', 'cancelled')"><i class="fa-solid fa-xmark"></i> إلغاء</button>
                    </div>
                `;
            } else if (booking.status === 'confirmed') {
                statusBadge = '<span class="badge confirmed">تم التأكيد</span>';
                actions = `<span style="color:var(--success-color); font-size:0.9rem;"><i class="fa-solid fa-check-double"></i> مكتمل</span>`;
            } else if (booking.status === 'cancelled') {
                statusBadge = '<span class="badge cancelled">ملغي</span>';
                actions = `<span style="color:var(--danger-color); font-size:0.9rem;"><i class="fa-solid fa-ban"></i> ملغي</span>`;
            }

            const receiptHTML = booking.receiptImage 
                ? `<button class="view-receipt-btn" onclick="openModal('${BASE_URL}/uploads/${booking.receiptImage}')">
                    <img src="${BASE_URL}/uploads/${booking.receiptImage}" class="receipt-img" alt="إيصال">
                   </button>`
                : 'لا يوجد';

            return `
                <tr>
                    <td>#${booking._id.toString().slice(-4)}</td>
                    <td>${booking.user?.name || 'مريض محذوف'}</td>
                    <td dir="ltr">${booking.user?.phone || 'غير متوفر'}</td>
                    <td>${booking.doctor?.name || 'طبيب محذوف'}</td>
                    <td>${booking.visitType}</td>
                    <td>${new Date(booking.date).toLocaleDateString('ar-EG')} - ${booking.time}</td>
                    <td>${receiptHTML}</td>
                    <td>${statusBadge}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        Swal.fire('خطأ', 'فشل في جلب الحجوزات', 'error');
    }
}

window.updateBookingStatus = function(bookingId, newStatus) {
    Swal.fire({
        title: 'هل أنت متأكد؟',
        text: newStatus === 'confirmed' ? 'سيتم تأكيد هذا الحجز' : 'سيتم إلغاء هذا الحجز',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: newStatus === 'confirmed' ? '#28a745' : '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'نعم، متأكد',
        cancelButtonText: 'تراجع'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await fetchAPI(`/bookings/${bookingId}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: newStatus })
                });

                loadBookings();
                updateBookingsBadge();
                
                const msg = newStatus === 'confirmed' ? 'تم تأكيد الحجز بنجاح ✅' : 'تم إلغاء الحجز بنجاح ❌';
                Swal.fire({ icon: 'success', title: 'تم التحديث!', text: msg, timer: 1500, showConfirmButton: false });
            } catch (err) {
                Swal.fire('خطأ', err.message, 'error');
            }
        }
    });
}

// التحكم في المودال للصورة
window.openModal = function(imageSrc) {
    const modal = document.getElementById('receiptModal');
    const modalImg = document.getElementById('modalImg');
    if (modal && modalImg) {
        modal.style.display = 'flex';
        modalImg.src = imageSrc;
    }
}
window.closeModal = function() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'none';
}

// ==========================================
// التنقل بين الأقسام والإحصائيات
// ==========================================
window.showSection = function(sectionId) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    
    if (sectionId === 'dashboardSection') {
        document.getElementById('nav-dashboard').classList.add('active');
        loadDashboardStats();
    }
    if (sectionId === 'bookingsSection') {
        document.getElementById('nav-bookings').classList.add('active');
        loadBookings();
    }
    if (sectionId === 'doctorsSection') {
        document.getElementById('nav-doctors').classList.add('active');
        loadDoctors();
    }
    if (sectionId === 'specialtiesSection') {
        document.getElementById('nav-specialties').classList.add('active');
        loadSpecialties();
    }
    if (sectionId === 'patientsSection') {
        document.getElementById('nav-patients').classList.add('active');
        loadPatients();
    }
}

async function loadDashboardStats() {
    try {
        const result = await fetchAPI('/stats');
        const stats = result.data;

        document.getElementById('statPatients').textContent = stats.patients;
        document.getElementById('statBookings').textContent = stats.bookings;
        document.getElementById('statDoctors').textContent = stats.doctors;
        document.getElementById('statSpecialties').textContent = stats.specialties;
    } catch (err) {
        console.log("Stats error:", err);
    }
}

// ==========================================
// قسم المرضى
// ==========================================
window.loadPatients = async function() {
    try {
        const { data } = await fetchAPI('/users');
        const tableBody = document.getElementById('patientsTableBody');
        if (!tableBody) return;

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">لا يوجد مرضى مسجلين حالياً.</td></tr>';
            return;
        }

        tableBody.innerHTML = data.map((user, index) => {
            const dateStr = new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${user.name}</td>
                <td dir="ltr">${user.email}</td>
                <td dir="ltr">${user.phone}</td>
                <td>${dateStr}</td>
            </tr>
            `;
        }).join('');
    } catch (err) {
        Swal.fire('خطأ', 'فشل في جلب المرضى', 'error');
    }
}

// ==========================================
// قسم التخصصات
// ==========================================
let currentSpecFile = null;

window.loadSpecialties = async function() {
    try {
        const { data } = await fetchAPI('/specialties');
        const tableBody = document.getElementById('specialtiesTableBody');
        if (!tableBody) return;

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">لا توجد تخصصات. قم بإضافة تخصص جديد.</td></tr>';
            return;
        }

        tableBody.innerHTML = data.map(spec => {
            const imgSrc = spec.image === 'default-specialty.png' ? 'images/default.jpg' : `${BASE_URL}/uploads/${spec.image}`;
            return `
            <tr>
                <td><img src="${imgSrc}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover;"></td>
                <td>${spec.name}</td>
                <td>${spec.description}</td>
                <td>
                    <div class="actions-container">
                        <button class="btn-primary" style="margin-left:5px; padding: 5px 10px; font-size: 0.9rem;" onclick="editSpecialty('${spec._id}')"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button class="btn-reject" onclick="deleteSpecialty('${spec._id}')"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    } catch (err) {
        Swal.fire('خطأ', 'فشل في جلب التخصصات', 'error');
    }
}

window.openSpecialtyModal = function() {
    document.getElementById('specialtyForm').reset();
    document.getElementById('specId').value = '';
    currentSpecFile = null;
    document.getElementById('specImagePreview').style.display = 'none';
    document.getElementById('specialtyModalTitle').textContent = 'إضافة تخصص جديد';
    document.getElementById('specialtyModal').style.display = 'flex';
}

window.editSpecialty = async function(id) {
    try {
        const { data } = await fetchAPI('/specialties');
        const spec = data.find(s => s._id === id);
        if (!spec) return;

        document.getElementById('specId').value = spec._id;
        document.getElementById('specName').value = spec.name;
        document.getElementById('specDesc').value = spec.description;
        
        currentSpecFile = null;
        const preview = document.getElementById('specImagePreview');
        preview.src = spec.image === 'default-specialty.png' ? 'images/default.jpg' : `${BASE_URL}/uploads/${spec.image}`;
        preview.style.display = 'block';

        document.getElementById('specialtyModalTitle').textContent = 'تعديل التخصص';
        document.getElementById('specialtyModal').style.display = 'flex';
    } catch (err) {
        Swal.fire('خطأ', 'فشل في جلب بيانات التخصص', 'error');
    }
}

window.closeSpecialtyModal = function() {
    document.getElementById('specialtyModal').style.display = 'none';
}

const specImageFile = document.getElementById('specImageFile');
if (specImageFile) {
    specImageFile.addEventListener('change', function() {
        currentSpecFile = this.files[0];
        if (currentSpecFile) {
            const reader = new FileReader();
            reader.addEventListener('load', function() {
                const preview = document.getElementById('specImagePreview');
                preview.src = this.result;
                preview.style.display = 'block';
            });
            reader.readAsDataURL(currentSpecFile);
        }
    });
}

const specialtyForm = document.getElementById('specialtyForm');
if (specialtyForm) {
    specialtyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', document.getElementById('specName').value);
        formData.append('description', document.getElementById('specDesc').value);
        if (currentSpecFile) {
            formData.append('image', currentSpecFile);
        }

        const specId = document.getElementById('specId').value;

        try {
            if (specId) {
                await fetchAPI(`/specialties/${specId}`, {
                    method: 'PUT',
                    body: formData
                });
                Swal.fire('نجاح', 'تم تحديث التخصص بنجاح', 'success');
            } else {
                await fetchAPI('/specialties', {
                    method: 'POST',
                    body: formData
                });
                Swal.fire('نجاح', 'تم إضافة التخصص بنجاح', 'success');
            }
            
            closeSpecialtyModal();
            loadSpecialties();
        } catch (err) {
            Swal.fire('خطأ', err.message, 'error');
        }
    });
}

window.deleteSpecialty = function(id) {
    Swal.fire({
        title: 'هل أنت متأكد؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'تراجع',
        confirmButtonColor: '#dc3545'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await fetchAPI(`/specialties/${id}`, { method: 'DELETE' });
                loadSpecialties();
                Swal.fire('تم الحذف', 'تم حذف التخصص بنجاح', 'success');
            } catch (err) {
                Swal.fire('خطأ', err.message, 'error');
            }
        }
    });
}

// ==========================================
// قسم الأطباء
// ==========================================
let currentDocFile = null;

window.loadDoctors = async function() {
    try {
        const { data } = await fetchAPI('/doctors');
        const tableBody = document.getElementById('doctorsTableBody');
        if (!tableBody) return;

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">لا يوجد أطباء. قم بإضافة طبيب جديد.</td></tr>';
            return;
        }

        tableBody.innerHTML = data.map(doc => {
            const imgSrc = doc.image === 'default-doctor.png' ? 'images/doc1.jpg' : `${BASE_URL}/uploads/${doc.image}`;
            return `
            <tr>
                <td><img src="${imgSrc}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;"></td>
                <td>${doc.name}</td>
                <td>${doc.specialty?.name || 'غير محدد'}</td>
                <td>${doc.experience} سنوات</td>
                <td>${doc.normalPrice} / ${doc.urgentPrice} ج.م</td>
                <td>
                    <div class="actions-container">
                        <button class="btn-primary" style="margin-left:5px; padding: 5px 10px; font-size: 0.9rem;" onclick="editDoctor('${doc._id}')"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button class="btn-reject" onclick="deleteDoctor('${doc._id}')"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    } catch (err) {
        Swal.fire('خطأ', 'فشل في جلب الأطباء', 'error');
    }
}

window.openDoctorModal = async function() {
    try {
        const { data: specialties } = await fetchAPI('/specialties');
        if (specialties.length === 0) {
            Swal.fire('تنبيه', 'يجب إضافة تخصص أولاً قبل إضافة الأطباء', 'warning');
            return;
        }

        const select = document.getElementById('docSpecialty');
        select.innerHTML = specialties.map(s => `<option value="${s._id}">${s.name}</option>`).join('');

        document.getElementById('doctorForm').reset();
        document.getElementById('docId').value = '';
        currentDocFile = null;
        document.getElementById('docImagePreview').style.display = 'none';

        document.querySelectorAll('.day-checkbox').forEach(cb => {
            cb.checked = false;
            const day = cb.dataset.day;
            document.querySelector(`.start-time[data-day="${day}"]`).disabled = true;
            document.querySelector(`.end-time[data-day="${day}"]`).disabled = true;
        });

        document.getElementById('doctorModalTitle').textContent = 'إضافة طبيب جديد';
        document.getElementById('doctorModal').style.display = 'flex';
    } catch (err) {
        Swal.fire('خطأ', 'فشل في تحضير النموذج', 'error');
    }
}

window.editDoctor = async function(id) {
    try {
        const { data: specialties } = await fetchAPI('/specialties');
        const select = document.getElementById('docSpecialty');
        select.innerHTML = specialties.map(s => `<option value="${s._id}">${s.name}</option>`).join('');

        const { data: doctors } = await fetchAPI('/doctors');
        const doc = doctors.find(d => d._id === id);
        if (!doc) return;

        document.getElementById('docId').value = doc._id;
        document.getElementById('docName').value = doc.name;
        document.getElementById('docSpecialty').value = doc.specialty?._id || '';
        document.getElementById('docTitle').value = doc.title;
        document.getElementById('docNormalPrice').value = doc.normalPrice;
        document.getElementById('docUrgentPrice').value = doc.urgentPrice;
        document.getElementById('docExperience').value = doc.experience;
        document.getElementById('docSlotDuration').value = doc.slotDuration || 30;
        document.getElementById('docBio').value = doc.bio;

        currentDocFile = null;
        const preview = document.getElementById('docImagePreview');
        preview.src = doc.image === 'default-doctor.png' ? 'images/doc1.jpg' : `${BASE_URL}/uploads/${doc.image}`;
        preview.style.display = 'block';

        document.querySelectorAll('.day-checkbox').forEach(cb => {
            cb.checked = false;
            const day = cb.dataset.day;
            const startInput = document.querySelector(`.start-time[data-day="${day}"]`);
            const endInput = document.querySelector(`.end-time[data-day="${day}"]`);
            startInput.disabled = true;
            endInput.disabled = true;
            startInput.value = '';
            endInput.value = '';
        });

        if (doc.workingDays) {
            doc.workingDays.forEach(wd => {
                const cb = document.querySelector(`.day-checkbox[data-day="${wd.day}"]`);
                if (cb) {
                    cb.checked = true;
                    const startInput = document.querySelector(`.start-time[data-day="${wd.day}"]`);
                    const endInput = document.querySelector(`.end-time[data-day="${wd.day}"]`);
                    startInput.disabled = false;
                    endInput.disabled = false;
                    startInput.value = wd.startTime;
                    endInput.value = wd.endTime;
                }
            });
        }

        document.getElementById('doctorModalTitle').textContent = 'تعديل بيانات الطبيب';
        document.getElementById('doctorModal').style.display = 'flex';
    } catch (err) {
        Swal.fire('خطأ', 'فشل في جلب بيانات الطبيب', 'error');
    }
}

window.closeDoctorModal = function() {
    document.getElementById('doctorModal').style.display = 'none';
}

document.addEventListener('change', function(e) {
    if (e.target.classList.contains('day-checkbox')) {
        const day = e.target.dataset.day;
        const startInput = document.querySelector(`.start-time[data-day="${day}"]`);
        const endInput = document.querySelector(`.end-time[data-day="${day}"]`);
        if (e.target.checked) {
            startInput.disabled = false;
            endInput.disabled = false;
        } else {
            startInput.disabled = true;
            endInput.disabled = true;
            startInput.value = '';
            endInput.value = '';
        }
    }
});

const docImageFile = document.getElementById('docImageFile');
if (docImageFile) {
    docImageFile.addEventListener('change', function() {
        currentDocFile = this.files[0];
        if (currentDocFile) {
            const reader = new FileReader();
            reader.addEventListener('load', function() {
                const preview = document.getElementById('docImagePreview');
                preview.src = this.result;
                preview.style.display = 'block';
            });
            reader.readAsDataURL(currentDocFile);
        }
    });
}

const doctorForm = document.getElementById('doctorForm');
if (doctorForm) {
    doctorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const workingDays = [];
        let scheduleError = null;

        document.querySelectorAll('.day-checkbox:checked').forEach(cb => {
            const day = cb.dataset.day;
            const startTime = document.querySelector(`.start-time[data-day="${day}"]`).value;
            const endTime = document.querySelector(`.end-time[data-day="${day}"]`).value;

            if (!startTime || !endTime) {
                scheduleError = `يرجى تحديد أوقات العمل لجميع الأيام المحددة`;
                return;
            }
            if (startTime >= endTime) {
                scheduleError = `وقت البداية يجب أن يكون قبل وقت النهاية (${day})`;
                return;
            }
            workingDays.push({ day, startTime, endTime });
        });

        if (scheduleError) {
            Swal.fire('خطأ في الجدول', scheduleError, 'error');
            return;
        }

        const formData = new FormData();
        formData.append('name', document.getElementById('docName').value);
        formData.append('specialty', document.getElementById('docSpecialty').value);
        formData.append('title', document.getElementById('docTitle').value);
        formData.append('normalPrice', document.getElementById('docNormalPrice').value);
        formData.append('urgentPrice', document.getElementById('docUrgentPrice').value);
        formData.append('experience', document.getElementById('docExperience').value);
        formData.append('slotDuration', document.getElementById('docSlotDuration').value);
        formData.append('bio', document.getElementById('docBio').value);
        formData.append('workingDays', JSON.stringify(workingDays)); // كـ JSON string
        
        if (currentDocFile) {
            formData.append('image', currentDocFile);
        }

        const docId = document.getElementById('docId').value;

        try {
            if (docId) {
                await fetchAPI(`/doctors/${docId}`, {
                    method: 'PUT',
                    body: formData
                });
                Swal.fire('نجاح', 'تم تحديث بيانات الطبيب بنجاح', 'success');
            } else {
                await fetchAPI('/doctors', {
                    method: 'POST',
                    body: formData
                });
                Swal.fire('نجاح', 'تم إضافة الطبيب بنجاح', 'success');
            }
            
            closeDoctorModal();
            loadDoctors();
        } catch (err) {
            Swal.fire('خطأ', err.message, 'error');
        }
    });
}

window.deleteDoctor = function(doctorId) {
    Swal.fire({
        title: 'هل أنت متأكد؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'تراجع'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await fetchAPI(`/doctors/${doctorId}`, { method: 'DELETE' });
                loadDoctors();
                Swal.fire('تم الحذف', 'تم حذف الطبيب بنجاح.', 'success');
            } catch (err) {
                Swal.fire('خطأ', err.message, 'error');
            }
        }
    });
}
