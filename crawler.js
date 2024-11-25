const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const baseUrl = 'https://www.digikala.com/search/category-pet-food-and-nutritional-supplement/';
  const products = [];
  const maxPages = 19; // Set the maximum number of pages to crawl
  const sortParameter = '&sort=7';

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
    const currentPageUrl = `${baseUrl}?page=${pageNumber}${sortParameter}`;
    console.log(`Crawling page: ${currentPageUrl}`);

    // Navigate to the current page
    await page.goto(currentPageUrl, { waitUntil: 'networkidle2' });

    // Wait for the loading spinner to disappear
    try {
      await page.waitForSelector('.loading-spinner', { hidden: true, timeout: 100000 }); // Adjust selector and timeout as needed
    } catch (error) {
      console.log(`Loading spinner not found or took too long to disappear on page ${pageNumber}`);
    }

    // Wait for the products container to be fully loaded
    await page.waitForSelector('div.product-list_ProductList__item__LiiNI', { visible: true, timeout: 100000 });

    const content = await page.content();
    const $ = cheerio.load(content);

    const productDiv = 'div.product-list_ProductList__item__LiiNI';

    // Extract products on the current page
    $(productDiv).each((i, element) => {
      const htmlContent = $(element).html();
      const $element = cheerio.load(htmlContent);

      const productName = $element('h3.ellipsis-2.text-body2-strong.text-neutral-700.styles_VerticalProductCard__productTitle__6zjjN').text().trim();
      const price = $element('span[data-testid="price-final"]').text().trim();
      const productImg = $element('img.w-full.rounded-medium.inline-block').attr('src');
      const href = $element('a').attr('href');

      if (productName && price && productImg) {
        products.push({
          id: products.length, // Unique ID across all pages
          name: productName,
          price: price,
          image: productImg,
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
