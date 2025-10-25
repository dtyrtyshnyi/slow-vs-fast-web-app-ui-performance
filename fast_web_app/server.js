const express = require('express');
const cors = require('cors');
const app = express();
// ФІКС: Запускаємо "хороший" API на іншому порті, наприклад 4001
const PORT = process.env.PORT || 4001;

app.use(cors());

// ФІКС 1: Повністю видалено функцію blockMainThread(100).
// Наш "хороший" API більше не блокує event loop.
// Він відповідатиме миттєво.

// "База даних" наших товарів
const productsData = [
    // ... (вміст той самий, але...)
    // ФІКС 2: Ми оновили посилання, щоб вони вказували на
    // нові, оптимізовані зображення у форматі .webp.
    {
        id: 1,
        name: "Компʼютерна миша",
        description: "Завантажується миттєво.",
        imageUrl: "img/2_mouse.webp" // .webp
    },
    {
        id: 2,
        name: "Оптимізований Macbook",
        description: "Це фото тепер важить 40KB",
        imageUrl: "img/1_mac.webp" // .webp
    },
    {
        id: 3,
        name: "Оперативна памʼять",
        description: "Швидка, як і має бути. Це фото тепер важить 50KB, а не 12MB.",
        imageUrl: "img/3_ram.webp" // .webp
    },
    {
        id: 4,
        name: "Мобільний телефон - Honor",
        description: "Chinese phone",
        imageUrl: "img/4_phone_honor.webp" // .webp
    },
    {
        id: 5,
        name: "Фотокамера - Nikon",
        description: "Great for portraits",
        imageUrl: "img/5_nikon.webp" // .webp
    },
    {
        id: 6,
        name: "Дрон - DJI Inspire",
        description: "Best for video filming",
        imageUrl: "img/6_dji_inspire.webp" // .webp
    },
    {
        id: 7,
        name: "Портативна колонка - JBL",
        description: "Маленька, зручна, якісна",
        imageUrl: "img/7_jbl.webp" // .webp
    },
    {
        id: 8,
        name: "Навушники",
        description: "Гучні",
        imageUrl: "img/8_headphones.webp" // .webp
    },
    {
        id: 9,
        name: "Ретро TV",
        description: "Для поціновувачів",
        imageUrl: "img/9_retro_tv.webp" // .webp
    },
];

app.get('/api/products', (req, res) => {
    console.log(`Request received for /api/products (FAST)`);
    
    // ФІКС 1 (продовження): Ми прибрали blockMainThread(100)

    // ФІКС 3: Ми прибрали 5% шанс помилки.
    // Наш "хороший" API стабільний і не повертає 500 помилок.
    // if (Math.random() < 0.05) { ... } -- ВИДАЛЕНО

    res.json(productsData);
});

app.listen(PORT, () => {
    console.log(`✨ 'Good API' server running on http://localhost:${PORT}`);
});