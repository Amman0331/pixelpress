# Pixelpress WebP Studio

A browser-based batch image converter with quality controls, resizing, single-image downloads, and ZIP export. The public folder contains the editable HTML, CSS, JavaScript, images, and three downloadable integration packages.

## Homepage and video tutorial

The homepage is public/index.html. The converter is public/converter.html. Select Watch tutorial on the homepage to play the 2:04 narrated video, jump to an app-specific chapter or download the MP4. The bundled video, English captions and poster are in public/media.

## Compare image quality

Convert an image to see the original and the exported WebP, then drag the divider to inspect details. For a batch, choose Compare on any converted file. Estimated compression loss uses sampled RGB structural similarity measured against the image at the export dimensions. File-size change and dimensions are listed separately. Adjust the quality, convert again, and compare the new result.

## Upload to GitHub

1. Extract the outer ZIP on your computer. Keep the three ZIP files inside public/downloads intact.
2. Create a GitHub repository such as pixelpress-webp-studio.
3. Choose the upload files option. Drag the public folder, vercel.json, and this README.md into the upload area and commit. Check that public/index.html and vercel.json are present at their expected paths.

## Deploy on Vercel

1. Open https://vercel.com/new and import your GitHub repository.
2. Use the repository root as the Root Directory. The included vercel.json selects the static site configuration and public as the Output Directory. Leave the build command empty. The website requires no environment variables.
3. Click Deploy and open the generated URL. Choose Open converter, then Try a sample and Convert to WebP. Download the file and open Integrations to access the three packages.

## Access

The ChatGPT sign-in gate on the original private site belongs to its host. This static package has no built-in sign-in. Choose the appropriate Vercel access settings before sharing your URL. Conversion runs on the visitor’s device.

## Integration setup

Each ZIP under public/downloads contains its own instructions. The Photoshop panel loads with Adobe UXP Developer Tool. The Canva editor app uses a Canva Developer Portal preview and a local Node companion. The Chrome/Edge extension loads in developer mode. Deploying the website makes the packages downloadable. Installing them in the respective apps is a separate step.

## Optional local preview

From the extracted project folder, run `python -m http.server 8000 --directory public` and visit http://localhost:8000.

## Documentation

- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://vercel.com/docs/builds/configure-a-build
