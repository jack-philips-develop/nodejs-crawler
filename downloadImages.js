const axios = require('axios');
const fs = require('fs');
const path = require('path');
const products = require('./100 bunches/Dog_WetFood_101_200_products.json')

async function downloadImage(url, imagePath) {
  try {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'
    });
    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log(`Image saved to ${imagePath}`);
    });

    writer.on('error', (err) => {
      console.error('Error saving image:', err);
    });
  } catch (error) {
    console.error('Error downloading image:', error);
  }
}

function getImageFilename(imageUrl) {
  const urlWithoutQuery = imageUrl.split('?')[0]; 
  const filename = path.basename(urlWithoutQuery);
  return filename;
}

async function downloadImages() {
  for (const product of products) {
    const imageUrl = product.image;
    const imageFileName = getImageFilename(imageUrl);
    const imagePath = path.join(__dirname, 'images', imageFileName);

    if (!fs.existsSync(path.join(__dirname, 'images'))) {
      fs.mkdirSync(path.join(__dirname, 'images'));
    }

    await downloadImage(imageUrl, imagePath);
  }
}

downloadImages();
