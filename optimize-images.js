const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Image optimization script
const optimizeImages = async () => {
  const assetsDir = path.join(__dirname, 'src/assets');
  const outputDir = path.join(__dirname, 'src/assets/optimized');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(assetsDir);
  
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const outputPath = path.join(outputDir, file);
    
    if (!fs.statSync(filePath).isFile()) continue;
    
    try {
      const ext = path.extname(file).toLowerCase();
      
      if (ext === '.png') {
        // Optimize PNG with compression
        await sharp(filePath)
          .png({ 
            quality: 80,
            compressionLevel: 9,
            adaptiveFiltering: true
          })
          .resize({ width: 1024, height: 1024, fit: 'inside' })
          .toFile(outputPath);
          
        console.log(`✓ Optimized ${file}`);
      } else if (ext === '.jpg' || ext === '.jpeg') {
        // Optimize JPEG
        await sharp(filePath)
          .jpeg({ quality: 85, progressive: true })
          .resize({ width: 1024, height: 1024, fit: 'inside' })
          .toFile(outputPath);
          
        console.log(`✓ Optimized ${file}`);
      }
      
      // Log size reduction
      const originalSize = fs.statSync(filePath).size;
      const optimizedSize = fs.statSync(outputPath).size;
      const reduction = Math.round((1 - optimizedSize / originalSize) * 100);
      console.log(`  Size reduction: ${reduction}%`);
      
    } catch (error) {
      console.error(`Error optimizing ${file}:`, error);
    }
  }
};

optimizeImages().catch(console.error);