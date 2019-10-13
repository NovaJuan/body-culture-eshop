import multer from 'multer';
import path from 'path';
import uuid from 'uuid/v4';

const storage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,path.join(__dirname,'../../public/product-images/main'));
    },
    filename:(req,file,cb) => {
        cb(null,uuid() + path.extname(file.originalname));
    }
})

const upload = multer({storage:storage});

export default upload;