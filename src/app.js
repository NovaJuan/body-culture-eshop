import express from 'express';
import path from 'path';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import exphbs from 'express-handlebars';
import session from 'express-session';


const app = express();

if(process.env.NODE_ENV === 'development'){
    dotenv.config();
}

//Settings
app.engine('.hbs',exphbs({
    layoutsDir:path.join(__dirname,'../admin_views/layouts'),
    defaultLayout:'main_layout',
    partialsDir:path.join(__dirname,'../admin_views/partials'),
    extname:'hbs'
}));
app.set('view engine', '.hbs');
app.set('views',path.join(__dirname,'../admin_views'));

//Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{
        path:'/api/admin',
        maxAge:1000*60*60
    }
}));

//statics
app.use('/public',express.static('./public'));

//Importing routes
import AdminRoutes from './routes/admin';
import ProductRoutes from './routes/products';
import AuthRoutes from './routes/auth';
import CartRoutes from './routes/cart';

//Routes
app.use('/api/admin',AdminRoutes);
app.use('/api/products',ProductRoutes);
app.use('/api/auth',AuthRoutes);
app.use('/api/cart',CartRoutes);

export default app;