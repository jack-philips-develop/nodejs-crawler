const { chromium } = require('playwright'); // Importing Playwright's chromium browser
const cheerio = require('cheerio');
const fs = require('fs');

(async () => {
  // Launch the Chromium browser instance
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const baseUrl = 'https://www.digikala.com/search/category-dog-supplements/';
  const sortParameter = '&sort=7';
  const products = [];
  const maxPages = 10; // Set the maximum number of pages to crawl

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
    const currentPageUrl = `${baseUrl}?page=${pageNumber}${sortParameter}`;
    console.log(`Crawling page: ${currentPageUrl}`);

    // Navigate to the current page
    await page.goto(currentPageUrl, { waitUntil: 'load' });

    // Wait for the loading spinner to disappear (adjust selector and timeout if needed)
    try {
      await page.waitForSelector('.loading-spinner', { hidden: true, timeout: 20000 });
    } catch (error) {
      console.log(`Loading spinner not found or took too long to disappear on page ${pageNumber}`);
    }

    // Wait for the products container to be fully loaded
    try {
      await page.waitForSelector('div.product-list_ProductList__item__LiiNI', { visible: true, timeout: 10000 });
    } catch (error) {
      console.log(`Products not found or took too long to load on page ${pageNumber}`);
    }

    // Get the page content after loading
    const content = await page.content();
    const $ = cheerio.load(content);

    const productDiv = 'div.product-list_ProductList__item__LiiNI';

    // Extract products on the current page
    $(productDiv).each((i, element) => {
      const htmlContent = $(element).html();
      const $element = cheerio.load(htmlContent);

      const productName = $element('h3.ellipsis-2.text-body2-strong.text-neutral-700.styles_VerticalProductCard__productTitle__6zjjN').text().trim();
      const price = $element('span[data-testid="price-final"]').text().trim();

      // Extract the picture source
      const picture = $element('picture');

      // Look for a <source> tag with type="image/webp"
      let imageUrl = '';
      const webpSrc = picture.find('source[type="image/webp"]').attr('srcset');
      if (webpSrc) {
        imageUrl = webpSrc; // Use the webp image if available
      } else {
        // Fallback to <source> with type="image/jpeg" if webp is not found
        const jpegSrc = picture.find('source[type="image/jpeg"]').attr('srcset');
        if (jpegSrc) {
          imageUrl = jpegSrc; // Use jpeg image if webp is not available
        }
      }

      const href = $element('a').attr('href');

      if (productName && price && imageUrl) {
        products.push({
          id: products.length, // Unique ID across all pages
          name: productName,
          price: price,
          image: imageUrl,
          href: href ? `https://www.digikala.com${href}` : null,
        });
      }
    });

    console.log(`Page ${pageNumber} crawled successfully.`);
  }

  // Save all collected products to a file
  fs.writeFile('output_all_pages.json', JSON.stringify(products, null, 2), (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('Data successfully written to output_all_pages.json');
    }
  });

  await browser.close();
})();
