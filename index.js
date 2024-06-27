import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
import * as __WEBPACK_EXTERNAL_MODULE__google_cloud_cloudbuild_db7e5847__ from "@google-cloud/cloudbuild";
import * as __WEBPACK_EXTERNAL_MODULE_archiver__ from "archiver";
import * as __WEBPACK_EXTERNAL_MODULE_bl__ from "bl";
import * as __WEBPACK_EXTERNAL_MODULE__actions_core_a059c86c__ from "@actions/core";
import * as __WEBPACK_EXTERNAL_MODULE__google_cloud_storage_82f19cec__ from "@google-cloud/storage";
import * as __WEBPACK_EXTERNAL_MODULE__google_cloud_run_8702af6a__ from "@google-cloud/run";
import * as __WEBPACK_EXTERNAL_MODULE__google_cloud_compute_35b247eb__ from "@google-cloud/compute";
/******/ var __webpack_modules__ = ({

/***/ 236:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __nccwpck_require__) => {

(function () {
  (__nccwpck_require__(750).config)(
    Object.assign(
      {},
      __nccwpck_require__(630),
      __nccwpck_require__(904)(process.argv)
    )
  )
})()


/***/ }),

/***/ 904:
/***/ ((module) => {

const re = /^dotenv_config_(encoding|path|debug|override|DOTENV_KEY)=(.+)$/

module.exports = function optionMatcher (args) {
  return args.reduce(function (acc, cur) {
    const matches = cur.match(re)
    if (matches) {
      acc[matches[1]] = matches[2]
    }
    return acc
  }, {})
}


/***/ }),

/***/ 630:
/***/ ((module) => {

// ../config.js accepts options via environment variables
const options = {}

if (process.env.DOTENV_CONFIG_ENCODING != null) {
  options.encoding = process.env.DOTENV_CONFIG_ENCODING
}

if (process.env.DOTENV_CONFIG_PATH != null) {
  options.path = process.env.DOTENV_CONFIG_PATH
}

if (process.env.DOTENV_CONFIG_DEBUG != null) {
  options.debug = process.env.DOTENV_CONFIG_DEBUG
}

if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
  options.override = process.env.DOTENV_CONFIG_OVERRIDE
}

if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
  options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY
}

module.exports = options


/***/ }),

/***/ 750:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(147)
const path = __nccwpck_require__(17)
const os = __nccwpck_require__(37)
const crypto = __nccwpck_require__(113)
const packageJson = __nccwpck_require__(968)

const version = packageJson.version

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

// Parse src into an Object
function parse (src) {
  const obj = {}

  // Convert buffer to string
  let lines = src.toString()

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n')

  let match
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1]

    // Default undefined or null to empty string
    let value = (match[2] || '')

    // Remove whitespace
    value = value.trim()

    // Check if double quoted
    const maybeQuote = value[0]

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n')
      value = value.replace(/\\r/g, '\r')
    }

    // Add to object
    obj[key] = value
  }

  return obj
}

function _parseVault (options) {
  const vaultPath = _vaultPath(options)

  // Parse .env.vault
  const result = DotenvModule.configDotenv({ path: vaultPath })
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`)
    err.code = 'MISSING_DATA'
    throw err
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
  const keys = _dotenvKey(options).split(',')
  const length = keys.length

  let decrypted
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim()

      // Get instructions for decrypt
      const attrs = _instructions(result, key)

      // Decrypt
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key)

      break
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return DotenvModule.parse(decrypted)
}

function _log (message) {
  console.log(`[dotenv@${version}][INFO] ${message}`)
}

function _warn (message) {
  console.log(`[dotenv@${version}][WARN] ${message}`)
}

function _debug (message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`)
}

function _dotenvKey (options) {
  // prioritize developer directly setting options.DOTENV_KEY
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY
  }

  // secondary infra already contains a DOTENV_KEY environment variable
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY
  }

  // fallback to empty string
  return ''
}

function _instructions (result, dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  let uri
  try {
    uri = new URL(dotenvKey)
  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      const err = new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    }

    throw error
  }

  // Get decrypt key
  const key = uri.password
  if (!key) {
    const err = new Error('INVALID_DOTENV_KEY: Missing key part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get environment
  const environment = uri.searchParams.get('environment')
  if (!environment) {
    const err = new Error('INVALID_DOTENV_KEY: Missing environment part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
  const ciphertext = result.parsed[environmentKey] // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`)
    err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'
    throw err
  }

  return { ciphertext, key }
}

function _vaultPath (options) {
  let possibleVaultPath = null

  if (options && options.path && options.path.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), '.env.vault')
  }

  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath
  }

  return null
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function _configVault (options) {
  _log('Loading env from encrypted .env.vault')

  const parsed = DotenvModule._parseVault(options)

  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  DotenvModule.populate(processEnv, parsed, options)

  return { parsed }
}

function configDotenv (options) {
  const dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding = 'utf8'
  const debug = Boolean(options && options.debug)

  if (options && options.encoding) {
    encoding = options.encoding
  } else {
    if (debug) {
      _debug('No encoding is specified. UTF-8 is used by default')
    }
  }

  let optionPaths = [dotenvPath] // default, look for .env
  if (options && options.path) {
    if (!Array.isArray(options.path)) {
      optionPaths = [_resolveHome(options.path)]
    } else {
      optionPaths = [] // reset default
      for (const filepath of options.path) {
        optionPaths.push(_resolveHome(filepath))
      }
    }
  }

  // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
  // parsed data, we will combine it with process.env (or options.processEnv if provided).
  let lastError
  const parsedAll = {}
  for (const path of optionPaths) {
    try {
      // Specifying an encoding returns a string instead of a buffer
      const parsed = DotenvModule.parse(fs.readFileSync(path, { encoding }))

      DotenvModule.populate(parsedAll, parsed, options)
    } catch (e) {
      if (debug) {
        _debug(`Failed to load ${path} ${e.message}`)
      }
      lastError = e
    }
  }

  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  DotenvModule.populate(processEnv, parsedAll, options)

  if (lastError) {
    return { parsed: parsedAll, error: lastError }
  } else {
    return { parsed: parsedAll }
  }
}

// Populates process.env from .env file
function config (options) {
  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options)
  }

  const vaultPath = _vaultPath(options)

  // dotenvKey exists but .env.vault file does not exist
  if (!vaultPath) {
    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`)

    return DotenvModule.configDotenv(options)
  }

  return DotenvModule._configVault(options)
}

function decrypt (encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), 'hex')
  let ciphertext = Buffer.from(encrypted, 'base64')

  const nonce = ciphertext.subarray(0, 12)
  const authTag = ciphertext.subarray(-16)
  ciphertext = ciphertext.subarray(12, -16)

  try {
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    aesgcm.setAuthTag(authTag)
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
  } catch (error) {
    const isRange = error instanceof RangeError
    const invalidKeyLength = error.message === 'Invalid key length'
    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data'

    if (isRange || invalidKeyLength) {
      const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    } else if (decryptionFailed) {
      const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY')
      err.code = 'DECRYPTION_FAILED'
      throw err
    } else {
      throw error
    }
  }
}

// Populate process.env with parsed values
function populate (processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug)
  const override = Boolean(options && options.override)

  if (typeof parsed !== 'object') {
    const err = new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate')
    err.code = 'OBJECT_REQUIRED'
    throw err
  }

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key]
      }

      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`)
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`)
        }
      }
    } else {
      processEnv[key] = parsed[key]
    }
  }
}

const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
}

module.exports.configDotenv = DotenvModule.configDotenv
module.exports._configVault = DotenvModule._configVault
module.exports._parseVault = DotenvModule._parseVault
module.exports.config = DotenvModule.config
module.exports.decrypt = DotenvModule.decrypt
module.exports.parse = DotenvModule.parse
module.exports.populate = DotenvModule.populate

module.exports = DotenvModule


/***/ }),

/***/ 113:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("crypto");

/***/ }),

/***/ 147:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("fs");

/***/ }),

/***/ 37:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("os");

/***/ }),

/***/ 17:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("path");

/***/ }),

/***/ 968:
/***/ ((module) => {

module.exports = JSON.parse('{"name":"dotenv","version":"16.4.5","description":"Loads environment variables from .env file","main":"lib/main.js","types":"lib/main.d.ts","exports":{".":{"types":"./lib/main.d.ts","require":"./lib/main.js","default":"./lib/main.js"},"./config":"./config.js","./config.js":"./config.js","./lib/env-options":"./lib/env-options.js","./lib/env-options.js":"./lib/env-options.js","./lib/cli-options":"./lib/cli-options.js","./lib/cli-options.js":"./lib/cli-options.js","./package.json":"./package.json"},"scripts":{"dts-check":"tsc --project tests/types/tsconfig.json","lint":"standard","lint-readme":"standard-markdown","pretest":"npm run lint && npm run dts-check","test":"tap tests/*.js --100 -Rspec","test:coverage":"tap --coverage-report=lcov","prerelease":"npm test","release":"standard-version"},"repository":{"type":"git","url":"git://github.com/motdotla/dotenv.git"},"funding":"https://dotenvx.com","keywords":["dotenv","env",".env","environment","variables","config","settings"],"readmeFilename":"README.md","license":"BSD-2-Clause","devDependencies":{"@definitelytyped/dtslint":"^0.0.133","@types/node":"^18.11.3","decache":"^4.6.1","sinon":"^14.0.1","standard":"^17.0.0","standard-markdown":"^7.1.0","standard-version":"^9.5.0","tap":"^16.3.0","tar":"^6.1.11","typescript":"^4.8.4"},"engines":{"node":">=12"},"browser":{"fs":false}}');

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nccwpck_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

// EXTERNAL MODULE: ./node_modules/dotenv/config.js
var config = __nccwpck_require__(236);
;// CONCATENATED MODULE: external "@google-cloud/cloudbuild"
var x = y => { var x = {}; __nccwpck_require__.d(x, y); return x; }
var y = x => () => x
const cloudbuild_namespaceObject = x({ ["CloudBuildClient"]: () => __WEBPACK_EXTERNAL_MODULE__google_cloud_cloudbuild_db7e5847__.CloudBuildClient });
;// CONCATENATED MODULE: external "archiver"
var external_archiver_x = y => { var x = {}; __nccwpck_require__.d(x, y); return x; }
var external_archiver_y = x => () => x
const external_archiver_namespaceObject = external_archiver_x({ ["default"]: () => __WEBPACK_EXTERNAL_MODULE_archiver__["default"] });
;// CONCATENATED MODULE: external "bl"
var external_bl_x = y => { var x = {}; __nccwpck_require__.d(x, y); return x; }
var external_bl_y = x => () => x
const external_bl_namespaceObject = external_bl_x({ ["BufferListStream"]: () => __WEBPACK_EXTERNAL_MODULE_bl__.BufferListStream });
// EXTERNAL MODULE: external "path"
var external_path_ = __nccwpck_require__(17);
;// CONCATENATED MODULE: external "url"
const external_url_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("url");
;// CONCATENATED MODULE: external "fs/promises"
const promises_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("fs/promises");
// EXTERNAL MODULE: external "crypto"
var external_crypto_ = __nccwpck_require__(113);
;// CONCATENATED MODULE: external "@actions/core"
var core_x = y => { var x = {}; __nccwpck_require__.d(x, y); return x; }
var core_y = x => () => x
const core_namespaceObject = core_x({ ["getInput"]: () => __WEBPACK_EXTERNAL_MODULE__actions_core_a059c86c__.getInput, ["info"]: () => __WEBPACK_EXTERNAL_MODULE__actions_core_a059c86c__.info, ["setFailed"]: () => __WEBPACK_EXTERNAL_MODULE__actions_core_a059c86c__.setFailed });
;// CONCATENATED MODULE: ./src/operations/utils.js








const utils_filename = (0,external_url_namespaceObject.fileURLToPath)(import.meta.url);
const utils_dirname = (0,external_path_.dirname)(utils_filename);

const archiveFile = async (dirPath) => {
    const sourceDir = dirPath;
    (0,core_namespaceObject.info)('archive file path', sourceDir);
    const archive = (0,external_archiver_namespaceObject["default"])('tar', { gzip: true, gzipOptions: { zlib: { level: 9 } } } );
    return new Promise((resolve) => {
        let bufferString;
        archive.glob('**/*', { cwd: external_path_.resolve(sourceDir), ignore: [ 'node_modules/**' ] });
        archive.pipe((0,external_bl_namespaceObject.BufferListStream)((err, data) => bufferString = data));
        archive.on('end', () => resolve(bufferString));
        archive.on('error', () => resolve(false));
        archive.finalize();
    });
};

const listFolder = async (dirPath) => {
    try {
        const sourceDir = dirPath;
        let files = [];
        const list = await (0,promises_namespaceObject.readdir)(sourceDir);
        for (const item of list) {
            const stats = await (0,promises_namespaceObject.stat)(`${sourceDir}/${item}`);
            if (stats.isFile()) files.push(`${sourceDir}/${item}`);
            else if (stats.isDirectory()) files = [ ...files, ...(await listFolder(`${dirPath}/${item}`))];
        };
        (0,core_namespaceObject.info)(files);
        return files; 
    } catch (e) {
        console.error(e);
        return [];
    }
};

const getPath = (inputPath) => inputPath;

const generateId = () => (0,external_crypto_.randomBytes)(16).toString('hex');

const readEnvironmentVariables = async (dirPath) => {
    try {
        const filePath = external_path_.join(dirPath, '.env');
        (0,core_namespaceObject.info)('env file path', filePath)
        const file = await (0,promises_namespaceObject.readFile)(filePath, 'utf-8');
        const variables = file.split(/\r?\n|\r|\n/g);
        let newVariables = [];
        for (const variable of variables) {
            if (variable.includes('#')) continue;
            const data = variable.split('=');
            if (data?.length !== 2) return false;
            (0,core_namespaceObject.info)(data[0], data[1]);
            newVariables.push({ name: data[0], value: data[1] });
        }; 
        return newVariables;
    } catch (e) {
        (0,core_namespaceObject.info)(e);
        return false;
    }
};


;// CONCATENATED MODULE: external "@google-cloud/storage"
var storage_x = y => { var x = {}; __nccwpck_require__.d(x, y); return x; }
var storage_y = x => () => x
const storage_namespaceObject = storage_x({ ["Storage"]: () => __WEBPACK_EXTERNAL_MODULE__google_cloud_storage_82f19cec__.Storage });
;// CONCATENATED MODULE: ./src/operations/storage.js





const storage = new storage_namespaceObject.Storage();

const uploadSingleFIle = async (path = '', data = '', bucket = defaultBucket) => { 
    try {
        if (!path) return false;
        await storage.bucket(bucket).file(path).save(data);
    } catch (e) {
        console.error(e);
        return false;
    }
};


const uploadFiles = async (filepath, sysConfig) => {
    try {
        const storageBucketReference = storage.bucket(sysConfig.deployment_bucket);
        const file = filepath.substring(filepath.lastIndexOf('/') + 1);
        const fullPath = path.resolve(filepath);
        const destination = `deployments/${file}`;
        const upload = await storageBucketReference.upload(fullPath, { destination });
        if (!upload) return false;
        return upload;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const uploadFile = async (bufferCont, sysConfig) => {
    try {
        const storageBucketReference = storage.bucket(sysConfig.deployment_bucket);
        const fileName = `${generateId()}.tar.gz`;
        await storageBucketReference.file(`deployments/${fileName}`).save(bufferCont);
        return fileName;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const deleteFile = async (objectName, sysConfig) => {
    try {
        const storageBucketReference = storage.bucket(sysConfig.deployment_bucket);
        const deletion = await storageBucketReference.file(`deployments/${objectName}`).delete();
        if (!deletion) return false;
        return deletion;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const deployFiles = async (folderPath, files, bucket) => {
    try {
        let promises = [];
        (0,core_namespaceObject.info)(getPath(folderPath));
        for (const file of files) {
            let destination = file.split(getPath(folderPath))?.[1];
            if (destination.startsWith('/')) destination = destination.substring(1);
            const upload = storage.bucket(bucket).upload(file, { destination });
            promises.push(upload);
        };
        const uploadedFiles = await Promise.all(promises);
        for (const uploadedFile of uploadedFiles) if (!uploadedFile) return false;
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const deleteFiles = async (files, bucket) => {
    try {
        let promises = [];
        for (const file of files) promises.push(storage.bucket(bucket).file(file).delete());
        const deletedFiles = await Promise.all(promises);
        for (const deletedFile of deletedFiles) if (!deletedFile) return false;
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const listFiles = async (bucket) => {
    try {
        let list = [];
        const [ operation ] = await storage.bucket(bucket).getFiles();
        if (!operation) return false;
        for (const { name } of operation) list.push(name);
        return list;
    } catch (e) {
        console.error(e);
        return false;    
    }
};

const setMetadata = async (metadata, bucket) => {
    if (!metadata) return false;
    try {
        const operation = await storage.bucket(bucket).setMetadata(metadata);
        if (!operation) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const makeFrontendPublic = async (bucket) => {
    try {
        const operation = await storage.bucket(bucket).makePublic();
        if (!operation) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
}; 

const createBucket = async (bucket, metadata = {}) => {
    if (!bucket) return false;
    try {
        const operation = await storage.createBucket(bucket, metadata);
        if (!operation) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

;// CONCATENATED MODULE: ./src/operations/build.js






const build = new cloudbuild_namespaceObject.CloudBuildClient();

const getClient = async () => {
    const { email, projectId } = await build.auth.getClient();
    return { serviceAccount: email, project: projectId };
};

// create Build

const createBuild = async (objectFileName, defaultLocation, sysConfig) => {
    if (!objectFileName || !defaultLocation) return false;
    (0,core_namespaceObject.info)(`create build, ${objectFileName}, ${defaultLocation}, ${sysConfig.deployment_bucket}`);
    try {
        const { project, serviceAccount } = await getClient();
        (0,core_namespaceObject.info)(`project, ${project}, serviceAccount, ${serviceAccount}`)
        if (!project) return false;
        if (!sysConfig.deployment_bucket) return false;
        (0,core_namespaceObject.info)('project passed, deployment_bucket passed');
        const artifactPath = `${defaultLocation}-docker.pkg.dev/${project}`;
        const imageName = generateId();
        const imagePath = `${artifactPath}/deployments/${imageName}`;
        const config = {
            projectId: project,
            build: {
                source: { storageSource: { bucket: sysConfig.deployment_bucket, object: `deployments/${objectFileName}` } },
                steps: [
                    {
                        name: 'gcr.io/k8s-skaffold/pack',
                        args: ['pack', 'build', imagePath, '--builder', 'gcr.io/buildpacks/builder']
                    }
                ],
                images: [ imagePath ]
            }
        };
        (0,core_namespaceObject.info)('passed step');

        const [ operation ] = await build.createBuild(config);
        (0,core_namespaceObject.info)('passed step for ops')
        const [ response ] = await operation.promise();
        console.log('RESPOSNE FROM CREATE BUILD', response);
        return response;
    } catch (e) {
        (0,core_namespaceObject.info)(e)
        uploadSingleFIle(`log.txt`, e.toString(), sysConfig.deployment_bucket);
        console.error(e);
        return false;
    }
};
;// CONCATENATED MODULE: external "@google-cloud/run"
var run_x = y => { var x = {}; __nccwpck_require__.d(x, y); return x; }
var run_y = x => () => x
const run_namespaceObject = run_x({ ["ServicesClient"]: () => __WEBPACK_EXTERNAL_MODULE__google_cloud_run_8702af6a__.ServicesClient });
;// CONCATENATED MODULE: ./src/operations/run.js



const services = new run_namespaceObject.ServicesClient();

const run_getClient = async () => {
    const { email, projectId } = await services.auth.getClient();
    return { serviceAccount: email, project: projectId };
};

// createService

const createService = async (serviceName, image, envVariables = [], defaultLocation) => {
    if (!serviceName || !image) return false;
    try {
        const { serviceAccount, project } = await run_getClient();
        const config = {
            parent: `projects/${project}/locations/${defaultLocation}`,
            service: {
                ingress: 'INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER',
                template: { serviceAccount, containers: [ { image, env: envVariables }] }
            },
            serviceId: serviceName
        };

        const [ operation ] = await services.createService(config);
        const [ response ] = await operation.promise();
        console.log('RESPONSE FROM CREATE SERVICE', response);
        return response;

    } catch (e) {
        console.error(e);
        return false;
    }
};

// updateService

const updateService = async (serviceName, image, envVariables = [], defaultLocation) => {
    if (!serviceName || !image) return false;
    try {
        const { serviceAccount, project } = await run_getClient();
        const config = {
            service: {
                name: `projects/${project}/locations/${defaultLocation}/services/${serviceName}`,
                ingress: 'INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER',
                template: { serviceAccount, containers: [ { image, env: envVariables }] }
            }
        };

        const [ operation ] = await services.updateService(config);
        const [ response ] = await operation.promise();
        console.log('RESPONSE FROM UPDATE SERVICE', response);
        return response;

    } catch (e) {
        console.error(e);
        return false;
    }
};


// makePublic

const makePublic = async (serviceName) => {
    if (!serviceName) return false;
    try {
        const config = {
            policy: { bindings: [ { role: "roles/run.invoker", members: [ "allUsers" ] } ] },
            resource: serviceName
        };

        const operation = await services.setIamPolicy(config);
        console.log('RESPONSE FROM MAKE PUBLIC', operation);
        return operation;

    } catch (e) {
        console.error(e);
        return false;
    }
};
;// CONCATENATED MODULE: external "@google-cloud/compute"
var compute_x = y => { var x = {}; __nccwpck_require__.d(x, y); return x; }
var compute_y = x => () => x
const compute_namespaceObject = compute_x({ ["BackendBucketsClient"]: () => __WEBPACK_EXTERNAL_MODULE__google_cloud_compute_35b247eb__.BackendBucketsClient, ["BackendServicesClient"]: () => __WEBPACK_EXTERNAL_MODULE__google_cloud_compute_35b247eb__.BackendServicesClient, ["GlobalOperationsClient"]: () => __WEBPACK_EXTERNAL_MODULE__google_cloud_compute_35b247eb__.GlobalOperationsClient, ["RegionNetworkEndpointGroupsClient"]: () => __WEBPACK_EXTERNAL_MODULE__google_cloud_compute_35b247eb__.RegionNetworkEndpointGroupsClient, ["UrlMapsClient"]: () => __WEBPACK_EXTERNAL_MODULE__google_cloud_compute_35b247eb__.UrlMapsClient });
;// CONCATENATED MODULE: ./src/operations/compute.js



const frontend = new compute_namespaceObject.BackendBucketsClient();
const backend = new compute_namespaceObject.BackendServicesClient();
const operations = new compute_namespaceObject.GlobalOperationsClient();
const mappings = new compute_namespaceObject.UrlMapsClient();
const endpoints = new compute_namespaceObject.RegionNetworkEndpointGroupsClient();

const createEndpoint = async (serviceName, defaultLocation, sysConfig) => {
    if (!serviceName) return false;
    try {
        const config = {
            project: sysConfig.project_id,
            networkEndpointGroupResource: { 
                name: serviceName,
                cloudRun: { service: serviceName },
                networkEndpointType: 'SERVERLESS'
            },
            region: defaultLocation
        };
        const [ operation ] = await endpoints.insert(config);
        console.log('endpoint', operation);
        if (operation?.error || !operation) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const createFrontendInstance = async (websiteName, bucketName, sysConfig) => {
    if (!websiteName || !bucketName) return false;
    try {
        const config = { 
            project: sysConfig.project_id,
            backendBucketResource: { name: websiteName, bucketName }    
        };
        const [ operation ] = await frontend.insert(config);
        console.log(operation);
        if (!operation || operation?.error) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const createBackendInstance = async (serviceName, endpointLink, sysConfig) => {
    if (!serviceName) return false;
    try {
        const config = { 
            project: sysConfig.project_id,
            backendServiceResource: {
                name: serviceName,
                backends: [ { group: endpointLink }],
                loadBalancingScheme: 'EXTERNAL_MANAGED'
            }    
        };
        const [ operation ] = await backend.insert(config);
        console.log('created instance', operation);
        if (!operation || operation?.error) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const awaitInstance = async (operationId, sysConfig) => {
    if (!operationId) return false;
    try {
        const config = {
            project: sysConfig.project_id,
            operation: operationId
        };
        const [ operation ] = await operations.wait(config);
        console.log(operation, operation?.error);
        if (operation?.error) return false;
        return operation?.status;
    } catch (e) {
        console.error(e);
        return false;
    };
};

const listMappings = async (sysConfig) => {
    try {
        const config = { project: sysConfig.project_id };
        const [ [ operation ] ] = await mappings.list(config);
        if (!operation || operation?.error) return false;
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const createMapping = async (serviceName, backendLink, sysConfig) => {
    if (!serviceName || !backendLink) return false;
    const list = await listMappings(sysConfig);
    if (!list) return false;
    try {
        const config = {
            project: sysConfig.project_id,
            urlMap: sysConfig.load_balancer,
            urlMapResource: {
                name: sysConfig.load_balancer,
                pathMatchers: [ ...list?.pathMatchers, { name: `${serviceName}-path`, defaultService: backendLink } ],
                hostRules: [ ...list?.hostRules, { hosts: [ `${serviceName}.${sysConfig['naked-domain']}` ], pathMatcher: `${serviceName}-path` } ]
            }
        };
        const [ operation ] = await mappings.patch(config);
        if (!operation || operation?.error) return false; 
        return operation;
    } catch (e) {
        console.error(e);
        return false;
    }
};
;// CONCATENATED MODULE: ./src/commands.js







const createBackend = async (folderPath, serviceName, location, envVariables, config) => {
    console.time();

    (0,core_namespaceObject.info)('STEP 1 of 10: Beginning archive...');
    const archivedFile = await archiveFile(folderPath);
    if (!archivedFile) return (0,core_namespaceObject.setFailed)('Archive failed!', archivedFile);

    (0,core_namespaceObject.info)('STEP 2 of 10: Beginning file upload...');
    const upload = await uploadFile(archivedFile, config);
    if (!upload) return (0,core_namespaceObject.setFailed)('Upload failed!', upload);

    (0,core_namespaceObject.info)('STEP 3 of 10: Beginning build creation... (1/3 longrunning - 60%)');
    const build = await createBuild(upload, location, config);
    if (!build) return (0,core_namespaceObject.setFailed)('Build creation failed!', build);

    (0,core_namespaceObject.info)('STEP 4 of 10: Beginning service creation... (2/3 longrunning - 25%)');
    const service = await createService(serviceName, build?.artifacts?.images?.[0], envVariables, location);
    if (!service) return (0,core_namespaceObject.setFailed)('Service creation failed!', service);

    (0,core_namespaceObject.info)('STEP 5 of 10: Beginning public access...');
    const access = await makePublic(service?.name);
    if (!access) return (0,core_namespaceObject.setFailed)('Public access failed!', access);

    (0,core_namespaceObject.info)('STEP 6 of 10: Beginning endpoint creation...');
    const endpoint = await createEndpoint(serviceName, location, config);
    if (!endpoint) return (0,core_namespaceObject.setFailed)('Endpoint creation failed!', endpoint);

    (0,core_namespaceObject.info)('STEP 7 of 10: Beginning instance creation...');
    const instance = await createBackendInstance(serviceName, endpoint?.latestResponse?.targetLink, config);
    if (!instance) return (0,core_namespaceObject.setFailed)('Instance creation failed!', instance);

    (0,core_namespaceObject.info)('STEP 8 of 10: Tracking instance creation... (3/3 longrunning - 15%)');
    const trackedInstance = await awaitInstance(instance?.name, config);
    if (!trackedInstance) return (0,core_namespaceObject.setFailed)('Instance tracking failed!', trackedInstance);

    (0,core_namespaceObject.info)('STEP 9 of 10: Beginning mapping creation...');
    const mapping = await createMapping(serviceName, instance?.latestResponse?.targetLink, config);
    if (!mapping) return (0,core_namespaceObject.setFailed)('Mapping creation failed!', mapping);

    (0,core_namespaceObject.info)('STEP 10 of 10: Beginning file clean-up...');
    const clean = await Promise.all([ deleteFile(upload, config) ]);
    for (const file of clean) if (!file) return (0,core_namespaceObject.setFailed)('File clean-up failed!', clean);

    (0,core_namespaceObject.info)('Backend successfully created.');
    console.timeEnd();
    return true;
};

const updateBackend = async (folderPath, serviceName, location, envVariables, config) => {
    console.time();

    (0,core_namespaceObject.info)('STEP 1 of 5: Beginning archive...');
    const archivedFile = await archiveFile(folderPath);
    if (!archivedFile) return (0,core_namespaceObject.setFailed)('Archive failed!', archivedFile);

    (0,core_namespaceObject.info)('STEP 2 of 5: Beginning file upload...');
    const upload = await uploadFile(archivedFile, config);
    if (!upload) return (0,core_namespaceObject.setFailed)('Upload failed!', upload);

    

    (0,core_namespaceObject.info)('STEP 3 of 5: Beginning build creation... (1/3 longrunning - 70%)');
    const build = await createBuild(upload, location, config);
    (0,core_namespaceObject.info)(build);
    if (!build) return (0,core_namespaceObject.setFailed)('Build creation failed!', build);

    (0,core_namespaceObject.info)('STEP 4 of 5: Beginning service creation... (2/2 longrunning - 30%)');
    const service = await updateService(serviceName, build?.artifacts?.images?.[0], envVariables, location);
    if (!service) return (0,core_namespaceObject.setFailed)('Service creation failed!', service);

    (0,core_namespaceObject.info)('STEP 5 of 5: Beginning file clean-up...');
    const clean = await Promise.all([ deleteFile(upload, config) ]);
    for (const file of clean) if (!file) return (0,core_namespaceObject.setFailed)('File clean-up failed!', clean);

    (0,core_namespaceObject.info)('Backend successfully updated.');
    console.timeEnd();
    return true;
};

const createFrontend = async (folderPath, websiteName, location, config) => {
    console.time();

    (0,core_namespaceObject.info)('STEP 1 OF 9: Beginning source creation...');
    const source = await createBucket(`${config.project_id}-${websiteName}`);
    if (!source) return (0,core_namespaceObject.setFailed)('Source creation failed!', source);

    (0,core_namespaceObject.info)('STEP 2 of 9: Beginning instance creation...');
    const instance = await createFrontendInstance(websiteName, `${config.project_id}-${websiteName}`, config);
    if (!instance) return (0,core_namespaceObject.setFailed)('Instance creation failed!', instance);

    (0,core_namespaceObject.info)('STEP 3 of 9: Tracking instance creation...');
    const trackedInstance = await awaitInstance(instance?.name, config);
    if (!trackedInstance) return (0,core_namespaceObject.setFailed)('Instance tracking failed!', trackedInstance);

    (0,core_namespaceObject.info)('STEP 4 of 9: Beginning mapping creation...');
    const mapping = await createMapping(websiteName, instance?.latestResponse?.targetLink, config);
    if (!mapping) return (0,core_namespaceObject.setFailed)('Mapping creation failed!', mapping);

    (0,core_namespaceObject.info)('STEP 5 of 9: Beginning file retrieval...');
    const currentFiles = await listFiles(`${config.project_id}-${websiteName}`);
    if (!currentFiles) return (0,core_namespaceObject.setFailed)('File retrieval failed!', currentFiles);

    (0,core_namespaceObject.info)('STEP 6 of 9: Beginning file clean-up...');
    const deletedFiles = await deleteFiles(currentFiles, `${config.project_id}-${websiteName}`);
    if (!deletedFiles) return (0,core_namespaceObject.setFailed)('File clean-up failed!', deletedFiles);

    (0,core_namespaceObject.info)('STEP 7 of 9: Beginning file upload...');
    const uploadedFiles = await deployFiles(folderPath, (await listFolder(folderPath)), `${config.project_id}-${websiteName}`);
    if (!uploadedFiles) return (0,core_namespaceObject.setFailed)('FIle upload failed!', uploadedFiles);

    (0,core_namespaceObject.info)('STEP 8 of 9: Beginning public access...');
    const access = await makeFrontendPublic(`${config.project_id}-${websiteName}`);
    if (!access) return (0,core_namespaceObject.setFailed)('Public access failed!', access);

    (0,core_namespaceObject.info)('STEP 9 of 9: Beginning metadata set...');
    const metadata = await setMetadata({ 
        website: { mainPageSuffix: 'index.html', notFoundPage: 'index.html' }
    }, `${config.project_id}-${websiteName}`);
    if (!metadata) return (0,core_namespaceObject.setFailed)('Metadata set failed!', metadata);

    (0,core_namespaceObject.info)('Frontend successfully created.');
    console.timeEnd();
    return true;
};

const updateFrontend = async (folderPath, websiteName, location, config) => {
    console.time();

    (0,core_namespaceObject.info)('STEP 1 of 4: Beginning file retrieval...');
    const currentFiles = await listFiles(`${config.project_id}-${websiteName}`);
    if (!currentFiles) return (0,core_namespaceObject.setFailed)('File retrieval failed!', currentFiles);

    (0,core_namespaceObject.info)('STEP 2 of 4: Beginning file clean-up...');
    const deletedFiles = await deleteFiles(currentFiles, `${config.project_id}-${websiteName}`);
    if (!deletedFiles) return (0,core_namespaceObject.setFailed)('File clean-up failed!', deletedFiles);

    (0,core_namespaceObject.info)('STEP 3 of 4: Beginning file upload...');
    const uploadedFiles = await deployFiles(folderPath, (await listFolder(folderPath)), `${config.project_id}-${websiteName}`);
    if (!uploadedFiles) return (0,core_namespaceObject.setFailed)('FIle upload failed!', uploadedFiles);

    (0,core_namespaceObject.info)('STEP 4 of 4: Beginning metadata set...');
    const metadata = await setMetadata({ 
        website: { mainPageSuffix: 'index.html', notFoundPage: 'index.html' }
    }, `${config.project_id}-${websiteName}`);
    if (!metadata) return (0,core_namespaceObject.setFailed)('Metadata set failed!', metadata);

    (0,core_namespaceObject.info)('Frontend successfully updated.');
    console.timeEnd();
    return true;
};
;// CONCATENATED MODULE: ./src/index.js






const runApp = async () => {
    try {

        // get inputs
        const load_balancer = (0,core_namespaceObject.getInput)('load_balancer');
        const naked_domain = (0,core_namespaceObject.getInput)('naked_domain');
        const project_id = (0,core_namespaceObject.getInput)('project_id');
        const deployment_bucket = (0,core_namespaceObject.getInput)('deployment_bucket');
        // validate inputs
        if (!load_balancer || !naked_domain || !project_id || !deployment_bucket) return (0,core_namespaceObject.setFailed)('Err: Missing inputs.');
        const config = { load_balancer, naked_domain, project_id, deployment_bucket };
        
        const operation = (0,core_namespaceObject.getInput)('operation');
        const type = (0,core_namespaceObject.getInput)('type');
        const name = (0,core_namespaceObject.getInput)('name');
        const location = (0,core_namespaceObject.getInput)('location');
        const path = (0,core_namespaceObject.getInput)('path');
        console.log(operation, type, name, location, path, 'test', type === 'backend');
        // validate inputs
        if (!operation || !type || !name || !location || !path) return (0,core_namespaceObject.setFailed)('Err: Missing inputs.');
        // handle corresponding process
        if (operation === 'create' && type === 'frontend') return createFrontend(path, name, location, config);
        else if (operation === 'update' && type === 'frontend') return updateFrontend(path, name, location, config);
        else if (operation === 'create' && type === 'backend') {
            // get variables
            const variables = await readEnvironmentVariables(path);
            if (!variables) return (0,core_namespaceObject.setFailed)('Err: Could not access variables.');
            return createBackend(path, name, location, variables, config);
        } else if (operation === 'update' && type === 'backend') {
            // get variables
            const variables = await readEnvironmentVariables(path);
            if (!variables) return (0,core_namespaceObject.setFailed)('Err: Could not access variables.');
            return updateBackend(path, name, location, variables, config);
        } else return (0,core_namespaceObject.setFailed)('Err: Invalid operation and/or deployment types.');
    } catch (e) {
        console.error(e);
        return (0,core_namespaceObject.setFailed)('Err: Something went wrong.');
    }
};

runApp();
})();

