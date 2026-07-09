const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const https = require('https');

// تحميل متغيرات البيئة
dotenv.config({ path: './.env' });

const Specialty = require('./models/Specialty');
const Doctor = require('./models/Doctor');

// دالة لتحميل صورة وحفظها
const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                   .on('error', reject)
                   .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        }).on('error', reject);
    });
};

// دالة لإنشاء SVG
const createSVG = (emoji, color1, color2, filepath) => {
    const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#grad)" rx="20"/>
        <text x="50%" y="55%" font-size="100" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>`;
    fs.writeFileSync(filepath, svgContent);
};

const specialtiesData = [
    { name: 'القلب', desc: 'علاج وجراحات القلب والأوعية الدموية وتخطيط القلب.', emoji: '🫀', color1: '#ff9999', color2: '#cc0000', en: 'cardiology' },
    { name: 'الباطنة', desc: 'تشخيص وعلاج الأمراض الباطنية والجهاز الهضمي.', emoji: '🩺', color1: '#99ccff', color2: '#0066cc', en: 'internal' },
    { name: 'العظام', desc: 'علاج الكسور وجراحات المفاصل والعمود الفقري.', emoji: '🦴', color1: '#e6e6e6', color2: '#999999', en: 'orthopedics' },
    { name: 'الأطفال', desc: 'رعاية صحية متكاملة للأطفال وحديثي الولادة.', emoji: '👶', color1: '#ffcc99', color2: '#ff6600', en: 'pediatrics' },
    { name: 'النساء والتوليد', desc: 'متابعة الحمل والولادة وأمراض النساء.', emoji: '🤰', color1: '#ff99cc', color2: '#cc0066', en: 'obstetrics' },
    { name: 'الأسنان', desc: 'تجميل وتقويم وزراعة الأسنان.', emoji: '🦷', color1: '#ccffff', color2: '#009999', en: 'dentistry' },
    { name: 'الجلدية', desc: 'علاج الأمراض الجلدية والعناية بالبشرة.', emoji: '🧴', color1: '#ffe6cc', color2: '#cc6600', en: 'dermatology' },
    { name: 'الأنف والأذن', desc: 'جراحات الأنف والأذن والحنجرة.', emoji: '👂', color1: '#cc99ff', color2: '#6600cc', en: 'ent' },
    { name: 'المخ والأعصاب', desc: 'تشخيص وعلاج أمراض الدماغ والأعصاب.', emoji: '🧠', color1: '#ffb3e6', color2: '#cc0099', en: 'neurology' },
    { name: 'الجراحة العامة', desc: 'العمليات الجراحية العامة والمناظير.', emoji: '🏥', color1: '#b3ffb3', color2: '#009900', en: 'surgery' }
];

const doctorsData = [
    { name: 'د. أحمد محمود', title: 'استشاري جراحة القلب', exp: 15, np: 400, up: 600, gender: 'men', id: 32 },
    { name: 'د. محمد علي', title: 'أخصائي الباطنة العامة', exp: 10, np: 250, up: 400, gender: 'men', id: 45 },
    { name: 'د. خالد إبراهيم', title: 'استشاري جراحة العظام', exp: 20, np: 500, up: 700, gender: 'men', id: 22 },
    { name: 'د. سارة مصطفى', title: 'أخصائية طب الأطفال', exp: 8, np: 200, up: 350, gender: 'women', id: 44 },
    { name: 'د. فاطمة حسن', title: 'استشارية النساء والتوليد', exp: 12, np: 350, up: 500, gender: 'women', id: 68 },
    { name: 'د. عمر طارق', title: 'أخصائي تجميل وزراعة الأسنان', exp: 7, np: 300, up: 450, gender: 'men', id: 75 },
    { name: 'د. ندى يوسف', title: 'أخصائية الأمراض الجلدية', exp: 9, np: 250, up: 400, gender: 'women', id: 33 },
    { name: 'د. طارق كامل', title: 'استشاري الأنف والأذن', exp: 18, np: 350, up: 550, gender: 'men', id: 91 },
    { name: 'د. حسام عادل', title: 'استشاري المخ والأعصاب', exp: 14, np: 450, up: 650, gender: 'men', id: 62 },
    { name: 'د. ياسمين كمال', title: 'أخصائية الجراحة العامة', exp: 11, np: 400, up: 600, gender: 'women', id: 12 }
];

const seedDatabase = async () => {
    try {
        console.log('جاري الاتصال بقاعدة البيانات...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات');

        console.log('جاري مسح التخصصات والأطباء القدامى...');
        await Specialty.deleteMany({});
        await Doctor.deleteMany({});
        console.log('✅ تم المسح بنجاح');

        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        console.log('جاري إنشاء التخصصات والأطباء...');
        for (let i = 0; i < specialtiesData.length; i++) {
            const specData = specialtiesData[i];
            const docData = doctorsData[i];

            // 1. إنشاء صورة التخصص (SVG)
            const specImageName = `spec_${specData.en}.svg`;
            createSVG(specData.emoji, specData.color1, specData.color2, path.join(uploadsDir, specImageName));

            // 2. إضافة التخصص لقاعدة البيانات
            const specialty = await Specialty.create({
                name: specData.name,
                description: specData.desc,
                image: specImageName
            });

            // 3. تحميل صورة الطبيب
            const docImageName = `doc_${docData.gender}_${docData.id}.jpg`;
            const docImageUrl = `https://randomuser.me/api/portraits/${docData.gender}/${docData.id}.jpg`;
            try {
                await downloadImage(docImageUrl, path.join(uploadsDir, docImageName));
            } catch (err) {
                console.log(`⚠️ فشل تحميل صورة الطبيب ${docData.name}، سيتم استخدام صورة افتراضية`);
                // إنشاء SVG كبديل
                createSVG(docData.gender === 'men' ? '👨‍⚕️' : '👩‍⚕️', '#e6f2ff', '#b3d9ff', path.join(uploadsDir, docImageName));
            }

            // 4. جدول عمل الطبيب
            const workingDays = [
                { day: "Saturday", startTime: "09:00", endTime: "14:00" },
                { day: "Sunday", startTime: "10:00", endTime: "16:00" },
                { day: "Monday", startTime: "12:00", endTime: "20:00" },
                { day: "Wednesday", startTime: "09:00", endTime: "15:00" }
            ];

            // 5. إضافة الطبيب لقاعدة البيانات
            await Doctor.create({
                name: docData.name,
                specialty: specialty._id,
                title: docData.title,
                bio: `متخصص في ${specData.name} بخبرة تتجاوز ${docData.exp} سنوات في تقديم الرعاية الصحية المتميزة للمرضى.`,
                experience: docData.exp,
                normalPrice: docData.np,
                urgentPrice: docData.up,
                slotDuration: 30,
                workingDays: workingDays,
                image: docImageName
            });

            console.log(`✅ تمت إضافة: ${specData.name} وطبيبها ${docData.name}`);
        }

        console.log('🎉 تم الانتهاء من إضافة جميع البيانات بنجاح!');
        process.exit(0);

    } catch (error) {
        console.error('❌ حدث خطأ:', error);
        process.exit(1);
    }
};

seedDatabase();
