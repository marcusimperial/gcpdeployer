import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';
import path from 'path';


// Determine the directory of the current file in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    // Install all required packages
    execSync('npm install @actions/core @google-cloud/artifact-registry @google-cloud/cloudbuild @google-cloud/compute @google-cloud/run @google-cloud/storage archiver bl dotenv google-auth-library', { stdio: 'inherit' });

    // Log success of installation
    console.log("Dependencies installed successfully.");

    const files = await readdir('./node_modules/@google-cloud');
    console.log('Installed packages:', files);

            // Construct paths to Google Cloud packages
            const cloudBuildPath = './node_modules/@google-cloud/cloudbuild/build/src/index.js';
            const storagePath = './node_modules/@google-cloud/storage/build/src/index.js';
            const runPath = './node_modules/@google-cloud/run/build/src/index.js';
            const computePath = './node_modules/@google-cloud/compute/build/src/index.js';
    
            // Dynamically import Google Cloud packages using absolute paths
            const [cloudBuild, storage, run, compute] = await Promise.all([
                import(cloudBuildPath),
                import(storagePath),
                import(runPath),
                import(computePath),
            ]);
    
            console.log("Google Cloud packages loaded successfully.");
    
            // Mock the Webpack external module imports
            global.__WEBPACK_EXTERNAL_MODULE__google_cloud_cloudbuild_db7e5847__ = cloudBuild;
            global.__WEBPACK_EXTERNAL_MODULE__google_cloud_storage_82f19cec__ = storage;
            global.__WEBPACK_EXTERNAL_MODULE__google_cloud_run_8702af6a__ = run;
            global.__WEBPACK_EXTERNAL_MODULE__google_cloud_compute_35b247eb__ = compute;



    // Construct the path to the index.js file
    const indexPath = join(__dirname, 'index.js');

    // Dynamically import index.js using a full path
    import(indexPath).then(module => {
        console.log("index.js loaded successfully.");
        // You can call any exported functions or classes from index.js if needed
        // For example: module.startApp();
    }).catch(error => {
        console.error("Failed to load index.js:", error);
    });
} catch (error) {
    console.error('Failed to install packages:', error);
}
