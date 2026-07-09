document.addEventListener('DOMContentLoaded', () => {
    // إخفاء الـ Loader بعد تحميل الصفحة
    const loaderWrapper = document.querySelector('.loader-wrapper');
    if (loaderWrapper) {
        setTimeout(() => {
            loaderWrapper.style.opacity = '0';
            loaderWrapper.style.visibility = 'hidden';
            setTimeout(() => {
                loaderWrapper.style.display = 'none';
            }, 500);
        }, 500); // تأخير بسيط لجمالية العرض
    }

    // تفعيل قائمة التنقل للموبايل
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // تغيير الأيقونة بين القائمة والاكس
            const icon = menuToggle.querySelector('i');
            if(navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // جلب اسم المستخدم وعرضه في النافبار
    const userNameElement = document.getElementById('navbar-username');
    const authLinkElement = document.getElementById('navbar-auth-link');
    const currentUser = JSON.parse(localStorage.getItem('alhayat_currentUser'));

    if (userNameElement) {
        if (currentUser) {
            userNameElement.textContent = `مرحباً، ${currentUser.name}`;
            userNameElement.href = currentUser.role === 'admin' ? 'admin-dashboard.html' : 'user-bookings.html';
            
            if (authLinkElement) {
                // إضافة زر لوحة الإدارة إذا كان المستخدم أدمن
                if (currentUser.role === 'admin') {
                    const adminBtn = document.createElement('a');
                    adminBtn.href = 'admin-dashboard.html';
                    adminBtn.className = 'btn btn-primary';
                    adminBtn.style.cssText = 'padding: 5px 15px; border-radius: 15px; margin-left: 10px; margin-right: 10px;';
                    adminBtn.innerHTML = '<i class="fa-solid fa-chart-pie"></i> لوحة الإدارة';
                    authLinkElement.parentNode.insertBefore(adminBtn, authLinkElement);
                } else if (currentUser.role === 'user') {
                    // إضافة زر 'حجوزاتي' للمستخدم العادي
                    const userBtn = document.createElement('a');
                    userBtn.href = 'user-bookings.html';
                    userBtn.className = 'btn btn-primary';
                    userBtn.style.cssText = 'padding: 5px 15px; border-radius: 15px; margin-left: 10px; margin-right: 10px;';
                    userBtn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> حجوزاتي';
                    authLinkElement.parentNode.insertBefore(userBtn, authLinkElement);
                }

                authLinkElement.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج';
                authLinkElement.href = '#';
                authLinkElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('alhayat_currentUser');
                    window.location.href = 'login.html';
                });
            }
        } else {
            userNameElement.textContent = 'تسجيل الدخول';
            userNameElement.href = 'login.html';
        }
    }
});
