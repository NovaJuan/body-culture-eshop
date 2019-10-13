import Cart from '../helpers/Cart';
import MakeQuery from '../database';
import jwt from 'jsonwebtoken';

const controller = {};

controller.getCart = async (req,res) => {
    //If user is logged in, use the id to search on shopping_cart table if exists cart
    if(req.headers['x-access-token']){
        const authorization = req.headers['x-access-token'].split(' ');
        if(authorization[0] === 'Bearer'){
            try {
                const user = jwt.verify(authorization[1],process.env.JWT_SECRET_C);
                try {
                    const result = await MakeQuery('SELECT cart FROM shopping_carts WHERE user_id=$1',[user.id]);
                    if(result.length > 0){
                        const cart = new Cart(result[0].cart);
                        const arrayCart =  cart.getItemsInArray();
                        return res.status(200).json({
                            cart:arrayCart
                        });
                    }
                } catch (err) {
                    console.log(err);
                    res.status(500).send('Something happen with DB')
                }
            } catch (err) {
                req.user = null;
            }
        }
    }

    // if not, try to use the client cart token
    if(req.headers['x-cart-token']){
        try {
            const data = jwt.verify(req.headers['x-cart-token'],process.env.JWT_SECRET_C);
            const cart = new Cart(data);
            const arrayCart =  cart.getItemsInArray()
            return res.status(200).json({
                cart:arrayCart
            });
        } catch (err) {
            console.log(err)
        }
    }

    return res.status(403).send('No users cart'); 
}

controller.addProduct = async (req,res) => {
    const {item} = req.params;
    const {size,qty,color} = req.body;

    // Getting product
    let product = null;
    try {
        const result = await MakeQuery('SELECT * FROM products WHERE id=$1',[item]);
        if(result.length < 1){
            return res.status(404).send('Product not found');
        }
        product = result[0];
    } catch (err) {
        console.log(err);
        return res.status(500).send('Error getting product')
    }

    //if user if log in try to use it's cart
    let oldCart = null;
    let user = null;
    if(req.headers['x-access-token']){
        const authorization = req.headers['x-access-token'].split(' ');
        if(authorization[0] === 'Bearer'){
            try {
                user = jwt.verify(authorization[1],process.env.JWT_SECRET_U);
                try {
                    const result = await MakeQuery('SELECT cart FROM shopping_carts WHERE user_id=$1',[user.id]);
                    if(result.length > 0){
                        oldCart = result[0].cart;
                    }
                } catch (err) {
                    console.log('err');
                    return res.status(500).send('Something happen with DB')
                }
            } catch (error) {
                req.user = null;
            }
        }
    }

    //if user doesn't have a cart use it's client cart
    if(req.headers['x-cart-token']){
        try {
            const clientCart = jwt.verify(req.headers['x-cart-token'],process.env.JWT_SECRET_C);
            oldCart = clientCart;
        } catch (error) {}
    }

    //create Cart Object with the old cart
    let cart = null
    if(oldCart === null){
        cart = new Cart();
    }else{
        cart = new Cart(oldCart);
    }

    const newItem = {
        id:product.id,
        name:product.name,
        thumbnail_url:product.thumbnail_url,
        qty:parseInt(qty),
        size:size,
        color:color,
        price:parseFloat(product.discount_price) ? parseFloat(product.discount_price) : parseFloat(product.price)
    }
    cart.addItem(newItem);

    const cartObject = cart.getCartObject(); 

    if(user){
        await MakeQuery('INSERT INTO shopping_carts (user_id,cart) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET cart=$2',[user.id,cartObject]);
    }

    res.setHeader('x-cart-token',jwt.sign(cartObject,process.env.JWT_SECRET_C,{expiresIn:3600}));

    res.status(200).send('Product added successfully');
}

controller.reduceOneItem = async (req,res) =>{
    const {key} = req.params;
    
    if(req.headers['x-access-token']){
        const authorization = req.headers['x-access-token'].split(' ');
        if(authorization[0] === 'Bearer'){
            try {
                const user = jwt.verify(authorization[1],process.env.JWT_SECRET_U);
                try {
                    const result = await MakeQuery('SELECT cart FROM shopping_carts WHERE user_id=$1',[user.id]);
                    if(result.length > 0){
                        const cart = new Cart(result[0].cart);
                        cart.reduceOneItem(key);
                        const cartObject = cart.getCartObject();
                        if(cart.productsCount < 1){
                            await MakeQuery('DELETE FROm shopping_carts WHERE user_id=$1',[user.id]);
                            res.setHeader('x-cart-token','');
                            return res.status(200).send('Product removed and cart deleted');
                        }else{
                            await MakeQuery('UPDATE shopping_carts set cart=$1 WHERE user_id=$2',[cartObject,user.id]);
                            res.setHeader('x-cart-token',jwt.sign(cartObject,process.env.JWT_SECRET_C,{expiresIn:3600}));
                            return res.status(200).send('Product reduced');
                        }
                    }else{
                        return res.status(404).send('You don\'t have a shopping cart');
                    }
                } catch (err) {
                    console.log('err');
                    return res.status(500).send('Something happen with DB')
                }
            } catch (error) {
                req.user = null;
            }
        }
    }else if(req.headers['x-cart-token']){
        try {
            const oldCart = jwt.verify(req.headers['x-cart-token'],process.env.JWT_SECRET_C);
            const cart = new Cart(oldCart);
            cart.reduceOneItem(key);
            const cartObject = cart.getCartObject();
            res.setHeader('x-cart-token',jwt.sign(cartObject,process.env.JWT_SECRET_C,{expiresIn:3600}));
            return res.status(200).send('Product reduced');
        } catch (err) {
            return res.status(404).send('You don\'t have a shopping cart');
        }
    }else{
        return res.status(404).send('You don\'t have a shopping cart');
    }
}

controller.removeItem = async (req,res) => {
    const {key} = req.params;
    
    if(req.headers['x-access-token']){
        const authorization = req.headers['x-access-token'].split(' ');
        if(authorization[0] === 'Bearer'){
            try {
                const user = jwt.verify(authorization[1],process.env.JWT_SECRET_U);
                try {
                    const result = await MakeQuery('SELECT cart FROM shopping_carts WHERE user_id=$1',[user.id]);
                    if(result.length > 0){
                        const cart = new Cart(result[0].cart);
                        cart.removeItem(key);
                        const cartObject = cart.getCartObject(); 
                        if(cart.productsCount < 1){
                            await MakeQuery('DELETE FROM shopping_carts WHERE user_id=$1',[user.id]);
                            res.setHeader('x-cart-token','');
                            return res.status(200).send('Product removed and cart deleted');
                        }else{
                            await MakeQuery('UPDATE shopping_carts set cart=$1 WHERE user_id=$2',[cartObject,user.id]);
                            res.setHeader('x-cart-token',jwt.sign(cartObject,process.env.JWT_SECRET_C,{expiresIn:3600}));
                            return res.status(200).send('Product removed');
                        }
                    }else{
                        return res.status(404).send('You don\'t have a shopping cart');
                    }
                } catch (err) {
                    console.log('err');
                    return res.status(500).send('Something happen with DB')
                }
            } catch (error) {
                req.user = null;
            }
        }
    }else if(req.headers['x-cart-token']){
        try {
            const oldCart = jwt.verify(req.headers['x-cart-token'],process.env.JWT_SECRET_C);
            const cart = new Cart(oldCart);
            cart.removeItem(key);
            const cartObject = cart.getCartObject();
            if(cart.productsCount < 1){
                res.setHeader('x-cart-token','');
                return res.status(200).send('Product removed and cart deleted');
            }else{
                res.setHeader('x-cart-token',jwt.sign(cartObject,process.env.JWT_SECRET_C,{expiresIn:3600}));
                return res.status(200).send('Product removed');
            }
        } catch (err) {
            return res.status(404).send('You don\'t have a shopping cart');
        }
    }else{
        return res.status(404).send('You don\'t have a shopping cart');
    }
}

controller.addOneItem = async (req,res) =>{
    const {key} = req.params;
    
    if(req.headers['x-access-token']){
        const authorization = req.headers['x-access-token'].split(' ');
        if(authorization[0] === 'Bearer'){
            try {
                const user = jwt.verify(authorization[1],process.env.JWT_SECRET_U);
                try {
                    const result = await MakeQuery('SELECT cart FROM shopping_carts WHERE user_id=$1',[user.id]);
                    if(result.length > 0){
                        const cart = new Cart(result[0].cart);
                        cart.addOneItem(key);
                        const cartObject = cart.getCartObject();
                        await MakeQuery('UPDATE shopping_carts set cart=$1 WHERE user_id=$2',[cartObject,user.id]);
                        res.setHeader('x-cart-token',jwt.sign(cartObject,process.env.JWT_SECRET_C,{expiresIn:3600}));
                        return res.status(200).send('One more item added');
                    }else{
                        return res.status(404).send('You don\'t have a shopping cart');
                    }
                } catch (err) {
                    console.log('err');
                    return res.status(500).send('Something happens with DB')
                }
            } catch (error) {
                req.user = null;
            }
        }
    }else if(req.headers['x-cart-token']){
        try {
            const oldCart = jwt.verify(req.headers['x-cart-token'],process.env.JWT_SECRET_C);
            const cart = new Cart(oldCart);
            cart.addOneItem(key);
            const cartObject = cart.getCartObject();
            res.setHeader('x-cart-token',jwt.sign(cartObject,process.env.JWT_SECRET_C,{expiresIn:3600}));
            return res.status(200).send('One more item added');
        } catch (err) {
            return res.status(404).send('You don\'t have a shopping cart');
        }
    }else{
        return res.status(404).send('You don\'t have a shopping cart');
    }
}

export default controller;