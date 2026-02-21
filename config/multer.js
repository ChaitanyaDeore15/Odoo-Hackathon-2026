const multer = require('multer');
const path = require('path');

function makeStorage(dest) {
    return multer.diskStorage({
        destination: (req, file, cb) => cb(null, dest),
        filename: (req, file, cb) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, unique + path.extname(file.originalname));
        },
    });
}

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Only images, PDFs and Word documents are allowed'));
};

const uploadReceipt = multer({ storage: makeStorage('uploads/receipts'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadDriverDoc = multer({ storage: makeStorage('uploads/driver-docs'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadTripAttach = multer({ storage: makeStorage('uploads/trip-attachments'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { uploadReceipt, uploadDriverDoc, uploadTripAttach };
