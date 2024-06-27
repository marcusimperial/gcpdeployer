import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Determine the directory of the current file in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    // Install all required packages
    execSync('npm install @actions/core @google-cloud/artifact-registry @google-cloud/cloudbuild @google-cloud/compute @google-cloud/run @google-cloud/storage archiver bl dotenv google-auth-library', { stdio: 'inherit' });

    // Log success of installation
    console.log("Dependencies installed successfully.");

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
