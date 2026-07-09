document.addEventListener('DOMContentLoaded', () => {
    
    // عنوان الـ API الأساسي للـ Backend
    const API_URL = 'http://localhost:5000/api/auth';

    // معالجة نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // عرض مؤشر التحميل
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
                submitBtn.disabled = true;

                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // حفظ المستخدم الحالي والـ Token
                    localStorage.setItem('alhayat_currentUser', JSON.stringify(data.user));
                    localStorage.setItem('alhayat_token', data.token); // حفظ الـ JWT
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'تم تسجيل الدخول بنجاح',
                        text: `مرحباً بك يا ${data.user.name}`,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        if (data.user.role === 'admin') {
                            window.location.href = 'admin-dashboard.html';
                        } else {
                            window.location.href = 'home.html';
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'خطأ',
                        text: data.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
                        confirmButtonColor: '#0E5E6F'
                    });
                }
            } catch (error) {
                console.error("Login Error:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ في الاتصال',
                    text: 'حدث خطأ أثناء الاتصال بالخادم. تأكد من تشغيل الـ Backend.',
                    confirmButtonColor: '#0E5E6F'
                });
            } finally {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = 'تسجيل الدخول';
                    submitBtn.disabled = false;
                }
            }
        });
    }

    // معالجة نموذج إنشاء الحساب
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: 'كلمات المرور غير متطابقة',
                    confirmButtonColor: '#0E5E6F'
                });
                return;
            }

            try {
                // عرض مؤشر التحميل
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
                submitBtn.disabled = true;

                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        name: fullName, 
                        email, 
                        phone, 
                        password 
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'تم إنشاء الحساب بنجاح',
                        text: 'يمكنك الآن تسجيل الدخول',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'login.html';
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'خطأ',
                        text: data.message || 'حدث خطأ أثناء إنشاء الحساب',
                        confirmButtonColor: '#0E5E6F'
                    });
                }
            } catch (error) {
                console.error("Register Error:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ في الاتصال',
                    text: 'حدث خطأ أثناء الاتصال بالخادم. تأكد من تشغيل الـ Backend.',
                    confirmButtonColor: '#0E5E6F'
                });
            } finally {
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = 'إنشاء حساب جديد';
                    submitBtn.disabled = false;
                }
            }
        });
    }
});
