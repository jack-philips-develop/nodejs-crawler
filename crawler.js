const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const baseUrl = 'https://www.digikala.com/search/category-dog-dry-food/';
  const products = [];
  const maxPages = 239; // Set the maximum number of pages to crawl
  const sortParameter = '&sort=7';

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
    const currentPageUrl = `${baseUrl}?page=${pageNumber}${sortParameter}`;
    console.log(`Crawling page: ${currentPageUrl}`);

    // Navigate to the current page
    await page.goto(currentPageUrl, { waitUntil: 'networkidle2' });

    // Wait for the loading spinner to disappear
    try {
      await page.waitForSelector('.loading-spinner', { hidden: true, timeout: 10000 }); // Adjust selector and timeout as needed
    } catch (error) {
      console.log(`Loading spinner not found or took too long to disappear on page ${pageNumber}`);
    }

    // Wait for the products container to be fully loaded
    await page.waitForSelector('div.product-list_ProductList__item__LiiNI', { visible: true, timeout: 10000 });

    const content = await page.content();
    const $ = cheerio.load(content);

    const productDiv = 'div.product-list_ProductList__item__LiiNI';

    // Extract products on the current page
    $(productDiv).each((i, element) => {
      const htmlContent = $(element).html();
      const $element = cheerio.load(htmlContent);

      const href = $element('a').attr('href');

      products.push({
        id: products.length, // Unique ID across all pages
        html: htmlContent,
        href: href ? `https://www.digikala.com${href}` : null,
      });
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
