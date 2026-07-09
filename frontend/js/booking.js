document.addEventListener('DOMContentLoaded', async () => {
    // التحقق من تسجيل الدخول
    const currentUser = JSON.parse(localStorage.getItem('alhayat_currentUser'));
    const token = localStorage.getItem('alhayat_token');

    if (!currentUser || !token) {
        Swal.fire({
            icon: 'warning', title: 'تنبيه',
            text: 'يجب تسجيل الدخول أولاً لإتمام الحجز',
            confirmButtonColor: '#0E5E6F'
        }).then(() => { window.location.href = 'login.html'; });
        return;
    }

    // جلب بيانات الطبيب
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doctorId');

    if (!doctorId) {
        document.body.innerHTML = '<h2 style="text-align:center; padding: 50px;">عذراً، لم يتم تحديد طبيب.</h2>';
        return;
    }

    let doctor = null;
    let bookedSlots = [];

    try {
        const docRes = await fetch(`/api/doctors/${doctorId}`);
        const docData = await docRes.json();
        
        if (!docRes.ok || !docData.success) {
            throw new Error(docData.message || 'الطبيب غير موجود');
        }
        doctor = docData.data;

        // جلب الفترات المحجوزة مسبقاً
        const slotsRes = await fetch(`/api/doctors/${doctorId}/slots`);
        const slotsData = await slotsRes.json();
        if (slotsRes.ok && slotsData.success) {
            bookedSlots = slotsData.data;
        }

    } catch (err) {
        document.body.innerHTML = `<h2 style="text-align:center; padding: 50px; color:red;">${err.message}</h2>`;
        return;
    }

    // =============================
    // عرض بيانات الطبيب مع السيرة الذاتية
    // =============================
    const doctorInfoCard = document.getElementById('doctorInfoCard');
    if (doctorInfoCard) {
        const imgSrc = doctor.image === 'default-doctor.png' ? '../images/doc1.jpg' : `/uploads/${doctor.image}`;
        doctorInfoCard.innerHTML = `
            <img src="${imgSrc}" alt="${doctor.name}">
            <h3>${doctor.name}</h3>
            <p class="doc-title">${doctor.title}</p>
            <div class="doc-info-row">
                <span>التخصص</span>
                <strong>${doctor.specialty?.name || 'غير محدد'}</strong>
            </div>
            <div class="doc-info-row">
                <span>الخبرة</span>
                <strong>${doctor.experience} سنوات</strong>
            </div>
            <div class="doc-info-row">
                <span>كشف عادي</span>
                <strong style="color:#28a745;">${doctor.normalPrice} ج.م</strong>
            </div>
            <div class="doc-info-row">
                <span>كشف مستعجل</span>
                <strong style="color:#dc3545;">${doctor.urgentPrice} ج.م</strong>
            </div>
            <div class="doc-info-row">
                <span>مدة الكشف</span>
                <strong>${doctor.slotDuration || 30} دقيقة</strong>
            </div>
            ${doctor.bio ? `<div class="doc-bio"><i class="fa-solid fa-circle-info" style="color:var(--primary-color); margin-left:5px;"></i>${doctor.bio}</div>` : ''}
        `;
    }

    // =============================
    // توليد المواعيد
    // =============================
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    const selectedTimeInput = document.getElementById('selectedTime');
    const selectedTimeBadge = document.getElementById('selectedTimeBadge');
    const selectedTimeText = document.getElementById('selectedTimeText');

    function generateTimeSlots(startTime, endTime, durationMin) {
        const slots = [];
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        let cur = sh * 60 + sm;
        const end = eh * 60 + em;
        while (cur + durationMin <= end) {
            const h = Math.floor(cur / 60).toString().padStart(2, '0');
            const m = (cur % 60).toString().padStart(2, '0');
            slots.push(`${h}:${m}`);
            cur += durationMin;
        }
        return slots;
    }

    const dayNames = {
        Saturday: 'السبت', Sunday: 'الأحد', Monday: 'الاثنين',
        Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة'
    };

    if (timeSlotsContainer) {
        const workingDays = doctor.workingDays || [];
        const slotDuration = doctor.slotDuration || 30;

        if (workingDays.length === 0) {
            timeSlotsContainer.innerHTML = `
                <div style="text-align:center; padding:20px; color:#999;">
                    <i class="fa-regular fa-calendar-xmark" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p>لم يتم تحديد مواعيد عمل لهذا الطبيب بعد.</p>
                </div>`;
        } else {
            workingDays.forEach(wd => {
                const slots = generateTimeSlots(wd.startTime, wd.endTime, slotDuration);
                const dayAr = dayNames[wd.day] || wd.day;

                const group = document.createElement('div');
                group.className = 'day-slots-group';
                group.innerHTML = `
                    <div class="day-slots-label">
                        <i class="fa-regular fa-calendar-days"></i>
                        ${dayAr}
                        <span>(${wd.startTime} - ${wd.endTime})</span>
                    </div>
                    <div class="slots-row" id="slots-${wd.day}"></div>
                `;
                timeSlotsContainer.appendChild(group);

                const slotsRow = group.querySelector(`#slots-${wd.day}`);

                if (slots.length === 0) {
                    slotsRow.innerHTML = '<span style="color:#999; font-size:0.85rem;">لا توجد فترات متاحة</span>';
                    return;
                }

                slots.forEach(time => {
                    const slotKey = `${wd.day}-${time}`;
                    const isBooked = bookedSlots.includes(slotKey);

                    const slot = document.createElement('div');
                    slot.className = `time-slot${isBooked ? ' booked' : ''}`;
                    slot.innerHTML = `<i class="fa-regular fa-clock" style="font-size:0.75rem;"></i> ${time}`;

                    if (!isBooked) {
                        slot.addEventListener('click', () => {
                            document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
                            slot.classList.add('selected');
                            const displayValue = `${dayAr} - ${time}`;
                            selectedTimeInput.value = displayValue;
                            selectedTimeInput.dataset.slotKey = slotKey;
                            selectedTimeText.textContent = displayValue;
                            selectedTimeBadge.classList.add('show');
                        });
                    } else {
                        slot.title = 'محجوز مسبقاً';
                    }
                    slotsRow.appendChild(slot);
                });
            });
        }
    }

    // معاينة صورة الإيصال
    const paymentReceiptInput = document.getElementById('paymentReceipt');
    const imagePreview = document.getElementById('imagePreview');
    let receiptFile = null;

    if (paymentReceiptInput && imagePreview) {
        paymentReceiptInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) { imagePreview.style.display = 'none'; receiptFile = null; return; }
            if (file.size > 2 * 1024 * 1024) {
                Swal.fire({ icon: 'warning', title: 'الصورة كبيرة جداً', text: 'يرجى اختيار صورة لا يتجاوز حجمها 2MB', confirmButtonColor: '#0E5E6F' });
                this.value = '';
                return;
            }
            receiptFile = file;
            const reader = new FileReader();
            reader.onload = function() {
                imagePreview.src = this.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    // إرسال طلب الحجز للـ API
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const visitType = document.getElementById('visitType').value;
            const selectedTime = selectedTimeInput.value;
            const slotKey = selectedTimeInput.dataset.slotKey || '';

            if (!selectedTime) {
                Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'يرجى اختيار موعد الكشف', confirmButtonColor: '#0E5E6F' });
                return;
            }
            if (!receiptFile) {
                Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'يرجى رفع صورة إيصال الدفع', confirmButtonColor: '#0E5E6F' });
                return;
            }

            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحجز...';

            const formData = new FormData();
            formData.append('doctor', doctorId);
            formData.append('visitType', visitType);
            formData.append('time', selectedTime);
            formData.append('slotKey', slotKey);
            formData.append('receiptImage', receiptFile);

            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}` // FormData لا نضع لها Content-Type
                    },
                    body: formData
                });
                
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'حدث خطأ أثناء الحجز');
                }

                Swal.fire({
                    icon: 'success', title: 'تم الطلب بنجاح',
                    text: 'تم إرسال طلب الحجز بنجاح، في انتظار موافقة الإدارة.',
                    confirmButtonColor: '#0E5E6F'
                }).then(() => { window.location.href = 'user-bookings.html'; });
                
            } catch (err) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'تأكيد الحجز';
                Swal.fire({
                    icon: 'error', title: 'خطأ',
                    text: err.message,
                    confirmButtonColor: '#0E5E6F'
                });
            }
        });
    }
});
