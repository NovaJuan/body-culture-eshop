import {Router} from 'express';

const router = Router();

//Auth Controllers
import auth from '../controllers/authControllers';

router.post('/signup',auth.onlyNotAuthenticated,auth.signUp);

router.post('/login',auth.onlyNotAuthenticated,auth.logIn);

router.get('/user',auth.getUserData);

export default router;