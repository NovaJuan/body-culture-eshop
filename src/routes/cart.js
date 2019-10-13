import {Router} from 'express';

const router = Router();

//Controller
import cart from '../controllers/cartControllers';

router.get('/',cart.getCart);

router.post('/add/:item',cart.addProduct);

router.post('/reduce/:key',cart.reduceOneItem);

router.post('/remove/:key',cart.removeItem);

router.post('/one-more/:key',cart.addOneItem);

export default router;