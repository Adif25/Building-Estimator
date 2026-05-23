const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function getWoodData(url) {
    // STEP 1: Launch a hidden Chrome browser
    console.log("Step 1: Launching browser...");
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        defaultViewport: null,
        args: ['--start-maximized']
    });

    // STEP 2: Open a new tab and set a real browser identity
    console.log("Step 2: Opening new tab...");
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // STEP 3: Go to the product page, wait for load, then wait for <h1> to appear
    console.log("Step 3: Navigating to URL...");
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {
        console.log("Step 3: Warning - h1 not found, page may be blocked.");
    });
    console.log("Step 3: Page loaded.");

    // STEP 4: Extract data from inside the page
    console.log("Step 4: Extracting data from page...");
    const data = await page.evaluate(() => {
        // 4a: Grab the product title from the <h1> tag
        const title = document.querySelector("h1")?.innerText;

        // 4b: Try to find price using a specific selector, fallback to regex search
        const priceText = document.querySelector('[data-testid="price"]')?.innerText
            || document.body.innerText.match(/\$\d+(\.\d+)?/)?.[0];

        // 4c: Convert "$12.58" -> 12.58 so we can do math
        const price = priceText ? parseFloat(priceText.replace("$", "")) : null;

        // 4d: Pull out the size like "1 in. x 12 in." from the title
        const sizeMatch = title ? title.match(/\d+\s*in\.\s*x\s*\d+\s*in\./i) : null;

        return {
            title,
            size: sizeMatch ? sizeMatch[0] : null,
            price
        };
    });

    // STEP 5: Close the browser to free memory
    console.log("Step 5: Closing browser...");
    await browser.close();

    // STEP 6: Return the extracted data
    console.log("Step 6: Done! Here is the result:");
    return data;
}

// Run it - paste a real Home Depot product URL here
getWoodData("https://www.homedepot.com/p/Weaber-1-in-x-12-in-x-Random-Length-S4S-Oak-Hardwood-Board-22080/207059039").then(console.log);
