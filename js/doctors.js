// بيانات التخصصات الطبية (ستأتي لاحقاً من قاعدة البيانات)
const specialties = [];

// بيانات الأطباء (ستأتي لاحقاً من قاعدة البيانات)
const doctors = [];

// حفظ في localStorage إذا لم يكن موجوداً
if (!localStorage.getItem('alhayat_specialties')) {
    localStorage.setItem('alhayat_specialties', JSON.stringify(specialties));
}
if (!localStorage.getItem('alhayat_doctors')) {
    localStorage.setItem('alhayat_doctors', JSON.stringify(doctors));
}

// إنشاء هيكل الحجوزات الفارغ إذا لم يكن موجوداً
if (!localStorage.getItem('alhayat_bookings')) {
    localStorage.setItem('alhayat_bookings', JSON.stringify([]));
}
