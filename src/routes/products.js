import {Router} from 'express';

const router = Router();

import products from '../controllers/productsControllers';

router.get('/',products.getAllProducts);

router.get('/product/:id',products.getOneProduct);

router.get('/last',products.getLastRelease);

router.get('/search/:product',products.searchProduct);

router.get('/category/:category',products.getByCategory);

router.get('/gender/both',products.getByGenderBoth);

router.get('/gender/men',products.getByGenderMen);

router.get('/gender/women',products.getByGenderWomen);

router.get('/gender/both/:category',products.getByGenderBothAndCategory);

router.get('/gender/men/:category',products.getByGenderMenAndCategory);

router.get('/gender/women/:category',products.getByGenderWomenAndCategory);

export default router;