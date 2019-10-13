import {Router} from 'express';
import csurf from 'csurf';
import upload from '../libs/multer';
import imageHandler from '../libs/image-handler';

const router = Router();

//Importing admin controllers
import admin from '../controllers/adminControllers';

//CSRF Protection middleware (inserted at /add and /update route as last middleware) and custom page;
const csrfProtection = csurf();
const csrfError = (err, req, res, next) => {
    console.log(req.originalUrl)
    if (err.code === 'EBADCSRFTOKEN'){
        // handle CSRF token errors here
        res.redirect('/api/admin/login');
    }
    next(err)
};
router.use(csrfError);

//errors messages
router.use((req,res,next)=>{
    if(req.session.error){
        res.locals.error = req.session.error;
        req.session.error = null; 
    }
    next()
});

router.route('/login')
.get(admin.onlyAdminNotLogged,csrfProtection,admin.adminLoginPage)
.post(admin.onlyAdminNotLogged,csrfProtection,admin.adminLogin);

//Only for logged admin routes 
router.use(admin.onlyAdminLogged);

router.route('/add')
.get(csrfProtection,admin.addProductPage)
.post(upload.single('image'),imageHandler,csrfProtection,admin.addProduct);

router.route('/update/:id')
.get(csrfProtection,admin.updatePage)
.post(upload.single('image'),imageHandler,csrfProtection,admin.uploadUpdate)

router.use(csrfProtection);

router.get('/',admin.adminIndex);

router.get('/search/:product',admin.searchProduct);

router.get('/discount/erase/all',admin.eraseAllDiscounts);

router.get('/discount/erase/:id',admin.eraseOneDiscount);

router.route('/discount')
    .get(admin.discountPage)
    .post(admin.addDiscount);

router.get('/delete/:id',admin.deleteProduct);


export default router;