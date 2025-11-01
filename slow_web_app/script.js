// URL "поганого" API на AWS EC2 або локально
//const API_HOST = 'http://localhost:4000';
//const API_HOST = 'http://192.168.0.103:4000';
//const API_HOST = 'http://my-lb-999493181.eu-central-1.elb.amazonaws.com';
const API_HOST = 'https://d8eaabtb7vxfq.cloudfront.net';
const API_URL = `${API_HOST}/api/products`;

// ПРОБЛЕМА UI 3: "Важкий" синхронний JS на клієнті
function blockClientThread(duration) {
    const start = Date.now();
    while (Date.now() - start < duration) {}
    console.log(`CLIENT thread was blocked for ${duration}ms`);
}
// Блокуємо клієнтський потік
blockClientThread(200); 

document.addEventListener('DOMContentLoaded', () => {
    // Запускаємо логіку завантаження товарів
    loadProducts();

    // ПРОБЛЕМА UI 4: Динамічний банер (CLS)
    setTimeout(() => {
        const bannerContainer = document.getElementById('dynamic-banner-container');
        if (bannerContainer) {
            const banner = document.createElement('div');
            banner.className = 'dynamic-banner';
            banner.textContent = '🔥 Flash Sale! Everything 50% off! 🔥';
            bannerContainer.appendChild(banner);
        }
    }, 1000); 
});

// -----------------------------------------------------------------
// *** НОВИЙ БОТЛНЕК: Послідовне завантаження зображень ***
// -----------------------------------------------------------------

/**
 * Допоміжна функція: завантажує одне зображення
 * і повертає Promise, який виконується, коли зображення завантажено.
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
 * Головна функція рендерингу.
 * Вона буде чекати (await) на завантаження КОЖНОГО зображення
 * перед тим, як почати завантажувати наступне.
 */
async function renderProductsSequentially(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = ''; // Очищуємо лоадер (спричиняє CLS - це добре для v1)

    // Використовуємо for...of, щоб 'await' працював всередині циклу
    for (const product of products) {
        console.log(`[BOTTLENECK] Starting to load ${product.imageUrl}...`);
        
        let loadedImage;
        try {
            // *** ОСЬ ТУТ БОТЛНЕК ***
            // Ми чекаємо, доки зображення повністю завантажиться
            loadedImage = await loadImage(product.imageUrl);
            console.log(`[BOTTLENECK] ...Finished loading ${product.imageUrl}`);

        } catch (error) {
            console.error(error);
            // Якщо зображення не завантажилось, створюємо "заглушку"
            loadedImage = document.createElement('div');
            loadedImage.className = 'image-placeholder-error';
            loadedImage.textContent = 'Image failed to load';
        }
        
        // Тепер, коли зображення ЗАВАНТАЖЕНЕ, створюємо картку
        const card = document.createElement('div');
        card.className = 'product-card';
        
        loadedImage.alt = product.name;
        card.appendChild(loadedImage);
        
        const title = document.createElement('h3');
        title.textContent = product.name;
        card.appendChild(title);
        
        const desc = document.createElement('p');
        desc.textContent = product.description;
        card.appendChild(desc);

        grid.appendChild(card);
        
        // Цикл не перейде до наступного 'product'
        // доки поточне зображення не завантажиться.
    }
    console.log('All sequential loading finished.');
}


/**
 * Функція, що завантажує дані з API
 */
async function loadProducts() {
    const grid = document.getElementById('product-grid');
    
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Server error! Status: ${response.status}`);
        }
        
        const products = await response.json();
        
        // *** ВИКЛИКАЄМО НОВУ "ПОВІЛЬНУ" ФУНКЦІЮ ***
        await renderProductsSequentially(products);

    } catch (error) {
        console.error("Failed to load products:", error);
        if (grid) {
            grid.innerHTML = `<div class="error">Failed to load products. Please check your connection or try again later.</div>`;
        }
    }
}