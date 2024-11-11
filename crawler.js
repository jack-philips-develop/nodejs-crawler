const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const url = '';
  await page.goto(url, { waitUntil: 'networkidle2' });

  const content = await page.content();
  const $ = cheerio.load(content);

  const productDiv = 'div.product-list_ProductList__item__LiiNI';

  const products = [];

  $(productDiv).each((i, element) => {
    const htmlContent = $(element).html();

    products.push({
      id: i,
      html: htmlContent,
    });
  });

  fs.writeFile('output1.json', JSON.stringify(products, null, 2), (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('Data successfully written to output.json');
    }
  });

  await browser.close();
})();
