import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Obtiene la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta del directorio uploads
const uploadsDir = path.join(__dirname, '../uploads');

// Verifica si la carpeta uploads existe, si no, créala
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer para almacenamiento local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Carpeta de destino
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre de archivo único
  }
});

const upload = multer({ storage });

// Función para eliminar un archivo
const deleteFile = (filename) => {
  const filePath = path.join(uploadsDir, filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error al eliminar el archivo: ${err.message}`);
    } else {
      console.log(`Archivo eliminado: ${filePath}`);
    }
  });
};

export { upload, deleteFile };