const { chromium } = require('playwright');
const cheerio = require('cheerio');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const baseUrl = 'https://www.digikala.com/search/category-dog-wet-food-and-pouch/';
  const sortParameter = '&sort=7';
  const products = [];
  const maxPages = 10;

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
    const currentPageUrl = `${baseUrl}?page=${pageNumber}${sortParameter}`;
    console.log(`Crawling page: ${currentPageUrl}`);
    await page.goto(currentPageUrl, { waitUntil: 'load' });

    try {
      await page.waitForSelector('.loading-spinner', { hidden: true, timeout: 20000 });
    } catch (error) {
      console.log(`Loading spinner not found or took too long to disappear on page ${pageNumber}`);
    }

    try {
      await page.waitForSelector('div.product-list_ProductList__item__LiiNI', { visible: true, timeout: 10000 });
    } catch (error) {
      console.log(`Products not found or took too long to load on page ${pageNumber}`);
    }

    const content = await page.content();
    const $ = cheerio.load(content);

    const productDiv = 'div.product-list_ProductList__item__LiiNI';

    $(productDiv).each((i, element) => {
      const htmlContent = $(element).html();
      const $element = cheerio.load(htmlContent);

      const productName = $element('h3.ellipsis-2.text-body2-strong.text-neutral-700.styles_VerticalProductCard__productTitle__6zjjN').text().trim();
      const price = $element('span[data-testid="price-final"]').text().trim();
      const picture = $element('picture');

      let imageUrl = '';
      const webpSrc = picture.find('source[type="image/webp"]').attr('srcset');
      if (webpSrc) {
        imageUrl = webpSrc;
      } else {
        const jpegSrc = picture.find('source[type="image/jpeg"]').attr('srcset');
        if (jpegSrc) {
          imageUrl = jpegSrc;
        }
      }

      const href = $element('a').attr('href');

      if (productName && price && imageUrl) {
        products.push({
          id: products.length,
          name: productName,
          price: price,
          image: imageUrl,
          href: href ? `https://www.digikala.com${href}` : null,
        });
      }
    });

    console.log(`Page ${pageNumber} crawled successfully.`);
  }

  fs.writeFile('output_all_pages.json', JSON.stringify(products, null, 2), (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('Data successfully written to output_all_pages.json');
    }
  });

  await browser.close();
})();
