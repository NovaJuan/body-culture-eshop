import MakeQuery from '../database';
import jwt from 'jsonwebtoken';
import {hash,genSalt,compare} from 'bcryptjs';

import Cart from '../helpers/Cart';

const auth = {};

auth.signUp = async (req,res) => {
    const {name,password,password2,email,state,city,address,phone} = req.body;
    
    if(!name || !password || !password2 || !email || !state || !city || !address || !phone){
        return res.json({
            error:true,
            message:'Missing fields'
        });
    }

    if(password.length < 4){
        return res.json({
            error:true,
            message:'Passwords must be at least 4 characters'
        });
    }

    if(password !== password2){
        return res.json({
            error:true,
            message:'Passwords don\'t match.'
        });
    }

    try {  
        const emailsInUse = await MakeQuery('SELECT COUNT(email) FROM users WHERE email=$1',[email]);
        if(parseInt(emailsInUse[0].count) > 0){
            return res.json({
                error:true,
                message:'Email is already in use'
            });
        }

        const salt= await genSalt(10);
        const hashedPassword = await hash(password,salt);
        
        const SQL = 'INSERT INTO users (name,password,email,state,city,address,phone) VALUES ($1,$2,$3,$4,$5,$6,$7)';
        const data = [name,hashedPassword,email,state,city,address,phone];

        await MakeQuery(SQL,data);

        res.json({
            message:'Users sign up successful now go log in',
        });
    } catch (err) {
        console.log(err);
        res.json({
            error:true,
            message:'Sorry, something went wrong, please wait...'
        });
    }
}

auth.logIn = async (req,res) => {
    const {email,password} = req.body;

    if(!email || !password){
        return res.json({
            error:true,
            message:'Missing fields'
        });
    }

    try {
        const user = (await MakeQuery('SELECT * FROM users WHERE email=$1',[email]))[0];
        if(!user){
            return res.json({
                error:true,
                message:'User or password are invalid'
            });
        }

        const verifyingPassword = await compare(password,user.password);

        if(!verifyingPassword){
            return res.json({
                error:true,
                message:'User or password are invalid'
            })
        }

        req.user = {
            id:user.id,
            name:user.name,
            email:user.email
        }

        const token = jwt.sign({
            id:user.id,
            name:user.name,
            email:user.email
        },process.env.JWT_SECRET_U,{
            expiresIn:3600
        });

        res.header('x-access-token',`Bearer ${token}`);

        //Looking if user has an cart
        let cart = null;
        const result = await MakeQuery('SELECT cart FROM shopping_carts WHERE user_id=$1',[user.id]);
        if(result.length > 0){
            const newCart = new Cart(result[0].cart);
            cart = newCart.getItemsInArray();
            res.header('x-cart-token',jwt.sign(newCart.getCartObject(),process.env.JWT_SECRET_C,{expiresIn:3600}));
        }else{
            // if cart exists and the user doesn't have a cart on the DB, create a cart on the DB
            if(req.headers['x-cart-token']){
                try {
                    const data = jwt.verify(req.headers['x-cart-token'],process.env.JWT_SECRET_C);
                    await MakeQuery('INSERT INTO shopping_carts (user_id,cart) VALUES ($1,$2)',[user.id,data]);
                    const newCart = new Cart(data);
                    cart = newCart.getItemsInArray();
                    
                } catch (error) {
                    null
                }
            }
        }

        res.json({
            message:'Users log in successful',
            user:{
                name:user.name,
                email:user.email,
                cart
            }
        });
    } catch (err) {
        req.user = null;
        console.log(err);
        res.json({
            error:true,
            message:'Sorry, something went wrong, please wait...'
        });
    }
}

auth.onlyAuthenticated = async (req,res,next) => {
    if(req.headers['x-access-token']){
        try {
            const authorization = req.headers['x-access-token'].split(' ');
            if(authorization[0] !== 'Bearer'){
                return res.status(401).send();
            }else{
                req.user = jwt.verify(authorization[1], process.env.JWT_SECRET_U);
                return next(); 
            }
        } catch (err) {
            req.user = null;
            return res.status(403).send();
        }
    }else{
        req.user = null;
        res.status(401).send()
    }
}

auth.onlyNotAuthenticated = async (req,res,next) => {
    if(req.headers['x-access-token']){
        try {
            const authorization = req.headers['x-access-token'].split(' ');
            if(authorization[0] !== 'Bearer'){
                req.user = null;
                next();
            }else{
                req.user = jwt.verify(authorization[1], process.env.JWT_SECRET_U);
                return res.status(401).send();
            }
        } catch (err) {
            next();
        }
    }else{
        req.user = null;
        next()
    }
}

auth.getUserData = async(req,res) => {
    if(req.headers['x-access-token']){
        try {
            const authorization = req.headers['x-access-token'].split(' ');
            if(authorization[0] !== 'Bearer'){
                req.user = null;
                return res.status(401).send();
            }else{
                req.user = jwt.verify(authorization[1], process.env.JWT_SECRET_U);
                return res.status(200).json({
                    user:{
                        name:req.user.name,
                        email:req.user.email
                    }
                })
            }
        } catch (err) {
            req.user = null;
            return res.status(403).send();
        }
    }else{
        req.user = null;
        res.status(401).send()
    }
}

export default auth;