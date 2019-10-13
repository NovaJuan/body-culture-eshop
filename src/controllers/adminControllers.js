import jwt from 'jsonwebtoken';
import MakeQuery from '../database';
import {genSalt,hash,compare} from 'bcryptjs';
import {unlink} from 'fs-extra';
import path from 'path';

const controller = {};

//AUTHORIZATION CONTROLLERS
controller.onlyAdminLogged = (req,res,next) =>{
    if(req.session.token){
        const authorization = req.session.token.split(' ');
        if(authorization[0] !== 'Bearer'){
            req.session.prevPage = req.originalUrl;

            return res.status(401).redirect('/api/admin/login');
        }
        try {
            jwt.verify(authorization[1],process.env.JWT_SECRET_A);
            return next();
        } catch (err) {
            req.session.prevPage = req.originalUrl;

            return res.status(401).redirect('/api/admin/login');
        }
    }

    req.session.prevPage = req.originalUrl;
    
    return res.redirect('/api/admin/login');
}

controller.onlyAdminNotLogged = (req,res,next) =>{
    if(req.session.token){
        const authorization = req.session.token.split(' ');
        if(authorization[0] !== 'Bearer'){
            return next();
        }
        try {
            jwt.verify(authorization[1],process.env.JWT_SECRET_A);
            return res.redirect('/api/admin');
        } catch (err) {
            return next();
        }
    }

    return next();
}
//END OF AUTHORIZATION CONTROLLERS

//LOGIN CONTROLLERS
controller.adminLoginPage = (req,res) => {
    res.render('login',{csrfToken:req.csrfToken()});
}

controller.adminLogin = async (req,res) => {
    const {email,password} = req.body;
    if(!email || !password){
        req.session.error = 'Missing fields';
        return res.redirect('/api/admin/login');
    }

    let admin = null;
    try {
        admin = (await MakeQuery('SELECT * FROM users WHERE email=$1',[email]))[0];
    } catch (err) {
        req.session.error = 'Something went wrong';
        return res.redirect('/api/admin/login');
    }

    if(!admin){
        req.session.error = 'Invalid user inputs';
        return res.redirect('/api/admin/login');
    }

    const verifyingPass =  await compare(password,admin.password);

    if(!verifyingPass){
        req.session.error = 'Invalid user inputs';
        return res.redirect('/api/admin/login');
    }

    req.session.token = `Bearer ${jwt.sign({id:admin.id},process.env.JWT_SECRET_A,{expiresIn:3600})}`;
    if(req.session.prevPage){
        console.log(req.session.prevPage)
        const prevPage = req.session.prevPage;
        req.session.prevPage = null;
        return res.redirect(prevPage);
    }
    res.redirect('/api/admin');
}
//END OF LOGIN CONTROLLERS

//INDEX PAGE CONTROLLERS
controller.adminIndex = async (req,res) => {
    try {
        let products = [];
        if(req.query.sex ==='male' || req.query.sex ==='female' || req.query.sex ==='both'){
            products = await MakeQuery('SELECT * FROM products WHERE sex=$1 ORDER BY created_at DESC',[req.query.sex]);
        }else{
            products =  await MakeQuery('SELECT * FROM products ORDER BY created_at DESC');
        }
        res.render('index',{products});
    } catch (err) {
        req.session.error = 'Something went wrong, please try again';
        res.render('index',{products:null});
    }
}

controller.searchProduct = async (req,res) => {
    const {product} = req.params;
    const sqlProduct = `%${product}%`;

    try {
        let products = [];
        if(req.query.type === 'id'){
            products = await MakeQuery('SELECT price,name,id FROM products WHERE id=$1',[product]);
        }else if(req.query.type === 'price'){
            products = await MakeQuery('SELECT name,price,id FROM products WHERE price >= $1',[product]);
        }else{
            products = await MakeQuery('SELECT products.price,products.name,products.id FROM products JOIN categories ON products.category_id=categories.id WHERE categories.category ILIKE $1 OR products.name ILIKE $1 OR products.sex = $2',[sqlProduct,product]);
        }
        res.status(200).json({products});
    } catch (err) {
        conosle.log(err);
        res.status(500).json('Something went wrong');
    }
}
//END OF INDEX PAGE CONTROLLERS


//DISCOUNT CONTROLLERS
controller.discountPage = async (req,res) => {
    let productsOnDiscount = []
    try {
        productsOnDiscount = await MakeQuery('SELECT * FROM products WHERE discount_price > 0');
    } catch (error) {
        req.session.error = 'Something went wrong loading discounts';
        productsOnDiscount = [];
    }
    res.render('discount',{productsOnDiscount,csrfToken:req.csrfToken()});
}

controller.addDiscount = async (req,res) =>{
    const {discount,discountIDs} = req.body;
    try {
        await MakeQuery('UPDATE products SET discount_price = price - (($1 * price) / 100), discount_percent = $1 WHERE id = ANY ($2)',[discount,discountIDs]);
        res.status(200).json('Data received');
    } catch (err) {
        req.session.error = 'Something went wrong, please try again';
        return res.status(500).redirect('/api/admin/discount');
    }
}

controller.eraseAllDiscounts = async (req,res) => {
    try {
        await MakeQuery('UPDATE products SET discount_price = 0, discount_percent = 0');
        res.redirect('/api/admin');
    } catch (err) {
        req.session.error = 'Something went wrong, please try again';
        return res.status(500).redirect('/api/admin/discount');
    }
}

controller.eraseOneDiscount = async (req,res) => {
    try {
        const {id} = req.params;
        await MakeQuery('UPDATE products SET discount_price = 0, discount_percent = 0 WHERE id = $1',[id]);
        res.redirect('/api/admin/discount');
    } catch (err) {
        req.session.error = 'Something went wrong, please try again';
        return res.status(500).redirect('/api/admin/discount');
    }
}
//END DISCOUNT CONTROLLERS

//ADD PRODUCT CONTROLLERS
controller.addProductPage = async (req,res) => {
    try {
        const categories = await MakeQuery('SELECT * FROM categories');
        res.render('add',{categories,csrfToken:req.csrfToken()});
    } catch (err) {
        console.log(err)
        req.session.error = 'Something went wrong, please try again';
        return res.status(500).redirect('/api/admin');
    }
}

controller.addProduct = async (req,res) => {
    const {main_url,card_url,thumbnail_url} = req.file;
    let {name,price,description,category,sex,sizes,colors} = req.body;
    sizes = sizes.split(';');
    colors = colors.split(';');
    category = parseInt(category);

    try {
        await MakeQuery('INSERT INTO products (name,description,price,category_id,sex,main_image_url,card_image_url,thumbnail_url,colors,sizes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[name,description,price,category,sex,main_url,card_url,thumbnail_url,colors,sizes]);
        res.redirect('/api/admin/');
    } catch (err) {
        console.log(err);
        req.session.error = 'Something went wrong, please try again';
        return res.status(500).redirect(req.originalUrl);
    }
}
//END OF ADD PRODUCT CONTROLLERS

//UPDATE PRODUCT CONTROLLERS
controller.updatePage = async (req,res) => {
    const {id} = req.params;
    let product = null;
    let categories = [];
    try {
        product = (await MakeQuery('SELECT products.*,categories.category as category_name FROM products JOIN categories ON products.category_id=categories.id WHERE products.id=$1',[id]))[0];
        categories = await MakeQuery('SELECT * FROM categories');
    } catch (err) {
        console.log(err);
        req.session.error = 'Something went wrong, please try again';
        return res.redirect('/api/admin');
    }

    if(!product){
        req.session.error = 'No product found';
        return res.status(500).redirect('/api/admin');
    }

    res.render('update',{product,id,csrfToken:req.csrfToken(),categories});
}

controller.uploadUpdate = async (req,res) => {
    const {id} = req.params;
    const {name,description,price,discount_price,discount_percent,sizes,colors,sex,category,old_main_url,old_card_url,old_thumbnail_url} = req.body;

    const fields = [];
    const values = [id];

    if(name){
        fields.push(`name = $${values.length + 1}`);
        values.push(name);
    }

    if(description){
        fields.push(`description = $${values.length + 1}`);
        values.push(description);
    }
    
    if(price){
        fields.push(`price = $${values.length + 1}`);
        values.push(parseInt(price));
    }

    if(discount_price){
        fields.push(`discount_price = $${values.length + 1}`);
        values.push(parseInt(discount_price));
    }

    if(discount_percent){
        fields.push(`discount_percent = $${values.length + 1}`);
        values.push(parseInt(discount_percent));
    }

    if(sizes){
        fields.push(`sizes = $${values.length + 1}`);
        values.push(sizes.split(';'));
    }

    if(colors){
        fields.push(`colors = $${values.length + 1}`);
        values.push(colors.split(';'));
    }

    if(sex){
        fields.push(`sex = $${values.length + 1}`);
        values.push(sex);
    }

    if(category){
        fields.push(`category_id = ${values.length + 1}`);
        values.push(parseInt(category));
    }

    
    if(req.file){
        try {
            fields.push(`main_image_url = $${values.length + 1}`);
            values.push(req.file.main_url);

            fields.push(`card_image_url = $${values.length + 1}`);
            values.push(req.file.card_url);

            fields.push(`thumbnail_url = $${values.length + 1}`);
            values.push(req.file.thumbnail_url);

            await unlink(path.join(__dirname,`../..${old_main_url}`));
            await unlink(path.join(__dirname,`../..${old_card_url}`));
            await unlink(path.join(__dirname,`../..${old_thumbnail_url}`));
        } catch (err) { null }
    }

    const updateQuery = `UPDATE products SET ${fields.join(',')} WHERE id = $1`;

    try {
        await MakeQuery(updateQuery,values);
        res.redirect('/api/admin');
    } catch (err) {
        console.log(err);
        req.session.error = 'Something went wrong, please try again'; 
        return res.redirect(req.originalUrl);
    }
}
//END OF UPDATE PRODUCT CONTROLLERS

//DELETE PRODUCT
controller.deleteProduct = async (req,res) => {
    const {id} = req.params;
    let product = null;
    try {
        product = (await MakeQuery('SELECT main_image_url, card_image_url, thumbnail_url FROM products WHERE id = $1',[id]))[0];
        if(!product){
            req.session.error = 'Product doesn\'t exists.'; 
            return res.redirect('/api/admin');
        }
    } catch (err) {
        console.log(err)
        req.session.error = 'Something went wrong, please try again'; 
        return res.redirect('/api/admin');
    }

    try {
        await unlink(path.join(__dirname,`../..${product.thumbnail_url}`));
        await unlink(path.join(__dirname,`../..${product.card_image_url}`));
        await unlink(path.join(__dirname,`../..${product.main_image_url}`));
    } catch (err) {
        null
    }

    try {
        await MakeQuery('DELETE FROM products WHERE id = $1',[id])
        res.redirect('/api/admin');
    } catch (err) {
        console.log(err)
        req.session.error = 'Something went wrong, please try again'; 
        return res.redirect('/api/admin');
    }
}
//END OF DELETE PRODUCT

export default controller;