const express = require('express');
const cors = require('cors'); // Для дозволу запитів з CDN/S3
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Конфіг для переключення локальних та CDN-URL зображень.
// Керувати через змінні оточення:
//   USE_CDN=true CDN_BASE_URL=https://d361b03n3b4xcx.cloudfront.net node server.js
const USE_CDN = (process.env.USE_CDN === 'true'); // default: false
const CDN_BASE_URL = (process.env.CDN_BASE_URL || '').replace(/\/$/, ''); // без кінцевого '/'

// Функція, що імітує блокуючу, "важку" операцію
// Це наш головний серверний BOTTLENECK.
function blockMainThread(duration) {
    const start = Date.now();
    while (Date.now() - start < duration) {
        // Синхронна "робота", що блокує ВЕСЬ event loop
    }
    console.log(`Thread was blocked for ${duration}ms`);
}

// Допоміжна функція для формування фінального imageUrl
function resolveImageUrl(product) {
    // Якщо увімкнено CDN і в товарі є явно вказане cdnImageUrl — використовуємо його
    if (USE_CDN && product.cdnImageUrl) {
        return product.cdnImageUrl;
    }

    // Якщо увімкнено CDN та заданий CDN_BASE_URL — будуємо URL на основі локального шляху
    if (USE_CDN && CDN_BASE_URL) {
        return `${CDN_BASE_URL}/${product.imageUrl.replace(/^\/+/, '')}`;
    }

    // Інакше повертаємо локальний шлях (як було раніше)
    return product.imageUrl;
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
        imageUrl: "img/1_mac.png"
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
    console.log(`Request received for /api/products... USE_CDN=${USE_CDN} CDN_BASE_URL=${CDN_BASE_URL || '<none>'}`);
    
    // Імітуємо повільний запит до БД або складну бізнес-логіку
    blockMainThread(100); 

    // Імітація можливості помилки під навантаженням
    if (Math.random() < 0.05) { // 5% шанс помилки
        console.log("Simulating server error...");
        return res.status(500).json({ error: "Internal Server Error. Please try again later." });
    }

    // Повертаємо копію даних з розв'язаними URL для клієнта
    const payload = productsData.map(p => ({
        ...p,
        imageUrl: resolveImageUrl(p)
    }));

    res.json(payload);
});

app.listen(PORT, () => {
    console.log(`'Bad API' server running on http://localhost:${PORT}`);
});