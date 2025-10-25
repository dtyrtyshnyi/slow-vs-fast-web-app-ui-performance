// ФІКС 1: Вказуємо URL "хорошого" API, який працює на порті 4001
// const API_HOST = 'localhost:4001'; // Використовуємо 'host.docker.internal' для Docker
const API_HOST = '192.168.0.103:4001'; // Адреса в локальній мережі, щоб мати доступ з іншого ПК
const API_URL = `http://${API_HOST}/api/products`;

// ФІКС 2: Повністю видалено 'blockClientThread(200)'.
// Ми більше не блокуємо головний потік клієнта
// синхронним JavaScript. Це драматично покращить TBT.

document.addEventListener('DOMContentLoaded', () => {
    // Логіка, як і раніше, запускається після завантаження DOM
    loadProducts();

    // ФІКС 3 (CLS): Цей код більше не спричиняє CLS,
    // оскільки в HTML/CSS ми зарезервували місце
    // за допомогою класу .banner-placeholder.
    setTimeout(() => {
        const bannerContainer = document.getElementById('dynamic-banner-container');
        if (bannerContainer) {
            // Опціонально: прибираємо клас-плейсхолдер
            bannerContainer.classList.remove('banner-placeholder'); 
            
            const banner = document.createElement('div');
            banner.className = 'dynamic-banner';
            banner.textContent = '🔥 Flash Sale! Everything 50% off! 🔥';
            // Очищуємо контейнер (якщо там був якийсь текст) і додаємо банер
            bannerContainer.innerHTML = ''; 
            bannerContainer.appendChild(banner);
        }
    }, 1000); 
});

// -----------------------------------------------------------------
// *** ФІКС 4: ПАРАЛЕЛЬНЕ завантаження та ЕФЕКТИВНИЙ рендеринг ***
// -----------------------------------------------------------------

/**
 * Допоміжна функція: завантажує одне зображення (залишилася та сама)
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src}`, { cause: err }));
        img.src = src;
    });
}

/**
 * ФІКС 4.1: Нова функція для паралельного завантаження.
 * Вона замінить 'renderProductsSequentially'.
 */
async function renderProductsInParallel(products) {
    const grid = document.getElementById('product-grid');
    
    // Створюємо масив "промісів" для завантаження зображень.
    // Кожен 'loadImage' запускається НЕГАЙНО, не чекаючи на інших.
    const loadPromises = products.map(product => {
        // ФІКС 5: Ми запитуємо оптимізовані .webp зображення
        // (API 'v2_good' вже надає нам ці посилання)
        return loadImage(product.imageUrl)
            .then(img => ({ product, img, status: 'fulfilled' })) // Повертаємо і продукт, і зображення
            .catch(error => {
                console.error(error);
                return { product, img: null, status: 'rejected' }; // Обробляємо помилку завантаження
            });
    });

    // *** ГОЛОВНИЙ ФІКС ***
    // Чекаємо, доки ВСІ проміси в 'loadPromises' не виконаються.
    // Оскільки вони всі були запущені одночасно, браузер
    // завантажить їх паралельно (пачками по ~6).
    const results = await Promise.all(loadPromises);

    // ФІКС 4.2: Ефективний DOM-рендеринг
    // Створюємо DocumentFragment. Це як "чорновик" DOM,
    // операції з яким не спричиняють reflow/repaint.
    const fragment = document.createDocumentFragment();

    for (const { product, img } of results) {
        // Створюємо картку (як і раніше)
        const card = document.createElement('div');
        card.className = 'product-card';
        
        if (img) {
            img.alt = product.name;
            card.appendChild(img);
        } else {
            // Якщо зображення не завантажилось, показуємо заглушку
            const errorPlaceholder = document.createElement('div');
            errorPlaceholder.className = 'image-error-placeholder';
            errorPlaceholder.textContent = 'Image failed to load';
            card.appendChild(errorPlaceholder);
        }
        
        const title = document.createElement('h3');
        title.textContent = product.name;
        card.appendChild(title);
        
        const desc = document.createElement('p');
        desc.textContent = product.description;
        card.appendChild(desc);

        // Додаємо готову картку у "чорновик", а не в реальний DOM
        fragment.appendChild(card);
    }

    // Очищуємо всі "скелетони"
    grid.innerHTML = '';
    // Вставляємо ВСІ 9 карток в DOM за ОДНУ операцію.
    // Це набагато швидше, ніж 9 окремих 'appendChild'.
    grid.appendChild(fragment);
    
    console.log('🚀 All parallel loading and efficient render finished.');
}


/**
 * Функція, що завантажує дані з API
 */
async function loadProducts() {
    const grid = document.getElementById('product-grid');
    
    try {
        // Запит тепер іде на швидкий 'v2_good' API
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Server error! Status: ${response.status}`);
        }
        
        const products = await response.json();
        
        // *** ВИКЛИКАЄМО НОВУ "ШВИДКУ" ФУНКЦІЮ ***
        await renderProductsInParallel(products);

    } catch (error) {
        console.error("Failed to load products:", error);
        if (grid) {
            // Замінюємо скелетони на повідомлення про помилку
            grid.innerHTML = `<div class="error">Failed to load products. Please check your connection or try again later.</div>`;
        }
    }
}