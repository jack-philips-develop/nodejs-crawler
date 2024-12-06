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

    // Create a write stream to save the image
    const writer = fs.createWriteStream(imagePath);

    // Pipe the response stream into the file
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
  // Extract the filename from the image URL (before any query parameters)
  const urlWithoutQuery = imageUrl.split('?')[0]; // Remove query parameters
  const filename = path.basename(urlWithoutQuery); // Get the last part of the URL (filename)
  return filename;
}

async function downloadImages() {
  // Loop through each product and download its image
  for (const product of products) {
    const imageUrl = product.image;
    const imageFileName = getImageFilename(imageUrl); // Extract the image filename from URL
    const imagePath = path.join(__dirname, 'images', imageFileName);

    // Create 'images' directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'images'))) {
      fs.mkdirSync(path.join(__dirname, 'images'));
    }

    // Download the image
    await downloadImage(imageUrl, imagePath);
  }
}

downloadImages();
