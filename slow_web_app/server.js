const express = require('express');
const cors = require('cors'); // Для дозволу запитів з S3
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Функція, що імітує блокуючу, "важку" операцію
// Це наш головний серверний BOTTLENECK.
function blockMainThread(duration) {
    const start = Date.now();
    while (Date.now() - start < duration) {
        // Синхронна "робота", що блокує ВЕСЬ event loop
    }
    console.log(`Thread was blocked for ${duration}ms`);
}

// "База даних" наших товарів
const productsData = [
    {
        id: 1,
        name: "Компʼютерна миша",
        description: "Завантажується так само повільно - важить аж 10 мб.",
        imageUrl: "img/2_mouse.png"
    },
    {
        id: 2,
        name: "Величезний Неоптимізований Macbook",
        description: "Цей Macbook настільки великий, що його фото важить 2.2MB.",
        // ПРОБЛЕМА UI 1: Посилання на величезне зображення
        imageUrl: "img/1_mac.png"
        //imageUrl: "https'://your-s3-bucket-url/high-res-product-1.jpg" 
    },
    {
        id: 3,
        name: "Оперативна памʼять",
        description: "Має бути швидка, але завантажується повільно.",
        imageUrl: "img/3_ram.png"
    },
    {
        id: 4,
        name: "Мобільний телефон - Honor",
        description: "Chinese phone",
        imageUrl: "img/4_phone_honor.png"
    },
    {
        id: 5,
        name: "Фотокамера - Nikon",
        description: "Great for portraits",
        imageUrl: "img/5_nikon.png"
    },
    {
        id: 6,
        name: "Дрон - DJI Inspire",
        description: "Best for video filming",
        imageUrl: "img/6_dji_inspire.png"
    },
    {
        id: 7,
        name: "Портативна колонка - JBL",
        description: "Маленька, зручна, якісна",
        imageUrl: "img/7_jbl.png"
    },
    {
        id: 8,
        name: "Навушники",
        description: "Гучні",
        imageUrl: "img/8_headphones.png"
    },
    {
        id: 9,
        name: "Ретро TV",
        description: "Для поціновувачів",
        imageUrl: "img/9_retro_tv.png"
    },
];

// Ендпоінт, який буде "гальмувати"
app.get('/api/products', (req, res) => {
    console.log(`Request received for /api/products...`);
    
    // Імітуємо повільний запит до БД або складну бізнес-логіку
    // Встановіть значення, яке буде помітним (напр., 100-300ms)
    // Під навантаженням JMeter ці 100ms перетворяться на секунди очікування.
    blockMainThread(100); 

    // Імітація можливості помилки під навантаженням
    // Наприклад, кожний 20-й запит "падає"
    if (Math.random() < 0.05) { // 5% шанс помилки
        console.log("Simulating server error...");
        return res.status(500).json({ error: "Internal Server Error. Please try again later." });
    }

    res.json(productsData);
});

app.listen(PORT, () => {
    console.log(`'Bad API' server running on http://localhost:${PORT}`);
});