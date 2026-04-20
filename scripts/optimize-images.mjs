import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';

await imagemin(['public/*.webp'], {
  destination: 'public',
  plugins: [
    imageminWebp({ quality: 80 }),
  ],
});

console.log('Images optimized successfully.');
