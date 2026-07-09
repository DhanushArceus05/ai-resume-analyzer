/**
 * Active storage backend. Local disk for now.
 *
 * To move to S3 or Cloudinary later, implement the same `saveFile(file)`
 * contract in a new module (e.g. `s3Storage.service.js`) and swap the
 * require below — no controller or route changes needed.
 */
module.exports = require('./localStorage.service');
