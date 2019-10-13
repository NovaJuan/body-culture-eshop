import MakeQuery from '../database.js';

const products = {};

products.getAllProducts = async (req,res) =>{
    //Testing if page param is a correct value
    const {page} = req.query;
    const offset = (parseInt(page) && parseInt(page) > 0) ? (parseInt(page) - 1) * 10 : 0;
    
    const SQL = `SELECT * FROM products ORDER BY created_at DESC LIMIT 10 OFFSET ${offset}`;

    try {
        const products = await MakeQuery(SQL);

        res.status(200).json({
            products,
            noProducts: products.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

products.getOneProduct = async (req,res) => {
    const {id} = req.params;

    const SQL = 'SELECT * FROM products WHERE id = $1';

    try {
        const product = await MakeQuery(SQL,[id]);

        res.status(200).json({
            product:product[0],
            noProducts: product.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

products.searchProduct = async (req,res) => {
    const {product} = req.params;
    const sqlProduct = `%${product}%`;

    const {page} = req.query;

    //Testing if page param is a correct value
    const offset = (parseInt(page) && parseInt(page) > 0) ? (parseInt(page) - 1) * 10 : 0;

    try {
        let products = [];
        
        products = await MakeQuery(`SELECT products.price,products.name,products.id FROM products JOIN categories ON products.category_id=categories.id WHERE categories.category ILIKE $1 OR products.name ILIKE $1 OR products.sex = $2 LIMIT 10 OFFSET ${offset}`,[sqlProduct,product]);
        
        res.status(200).json({products});
    } catch (err) {
        conosle.log(err);
        res.status(500).json('Something went wrong');
    }
}

products.getByCategory = async (req,res) => {
    const {category} = req.params;
    const {page} = req.query;

    //Testing if page param is a correct value
    const offset = (parseInt(page) && parseInt(page) > 0) ? (parseInt(page) - 1) * 10 : 0;

    const categorySQL = `%${category}%`;

    const SQL = `SELECT products.* FROM categories JOIN products ON categories.id=products.category_id WHERE categories.category ILIKE $1 ORDER BY id ASC LIMIT 10 OFFSET ${offset}`;

    try {
        const products = await MakeQuery(SQL,[categorySQL]);

        res.status(200).json({
            products,
            noProducts: products.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

products.getByGenderBoth = async (req,res) =>{
    const {page} = req.query;

    //Testing if page param is a correct value
    const offset = (parseInt(page) && parseInt(page) > 0) ? (parseInt(page) - 1) * 10 : 0;

    const SQL = `SELECT * FROM products WHERE sex='both' ORDER BY id ASC LIMIT 10 OFFSET ${offset}`;

    try {
        const products = await MakeQuery(SQL);

        res.status(200).json({
            products,
            noProducts: products.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

products.getByGenderMen = async (req,res) =>{
    const {page} = req.query;

    //Testing if page param is a correct value
    const offset = (parseInt(page) && parseInt(page) > 0) ? (parseInt(page) - 1) * 10 : 0;

    const SQL = `SELECT * FROM products WHERE sex='male' ORDER BY id ASC LIMIT 10 OFFSET ${offset}`;

    try {
        const products = await MakeQuery(SQL);

        res.status(200).json({
            products,
            noProducts: products.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

products.getByGenderWomen = async (req,res) =>{
    const {page} = req.query;

    //Testing if page param is a correct value
    const offset = (parseInt(page) && parseInt(page) > 0) ? (parseInt(page) - 1) * 10 : 0;

    const SQL = `SELECT * FROM products WHERE sex='female' ORDER BY id ASC LIMIT 10 OFFSET ${offset}`;

    try {
        const products = await MakeQuery(SQL);

        res.status(200).json({
            products,
            noProducts: products.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

products.getByGenderBothAndCategory = async (req,res) =>{
    const {page} = req.query;
    const {category} = req.params;
    const categorySQL = `%${category}%`;
    //Testing if page param is a correct value
    const offset = (parseInt(page) && parseInt(page) > 0) ? (parseInt(page) - 1) * 10 : 0;

    const SQL = `SELECT products.* FROM products JOIN categories ON products.category_id=categories.id WHERE products.gender='both' AND categories.category ILIKE $1 ORDER BY id ASC LIMIT 10 OFFSET ${offset}`;

    try {
        const products = await MakeQuery(SQL,[categorySQL]);

        res.status(200).json({
            products,
            noProducts: products.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

products.getByGenderMenAndCategory = async (req,res) =>{
    const {page} = req.query;
    const {category} = req.params;
    const categorySQL = `%${category}%`;
    //Testing if page param is a correct value
    const offset = (parseInt(page) && parseInt(page) > 0) ? (parseInt(page) - 1) * 10 : 0;

    const SQL = `SELECT products.* FROM products JOIN categories ON products.category_id=categories.id WHERE products.gender='male' AND categories.category ILIKE $1 ORDER BY id ASC LIMIT 10 OFFSET ${offset}`;

    try {
        const products = await MakeQuery(SQL,[categorySQL]);

        res.status(200).json({
            products,
            noProducts: products.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

products.getByGenderWomenAndCategory = async (req,res) =>{
    const {page} = req.query;
    const {category} = req.params;
    const categorySQL = `%${category}%`;
    //Testing if page param is a correct value
    const offset = (parseInt(page) && parseInt(page) > 0) ? (parseInt(page) - 1) * 10 : 0;

    const SQL = `SELECT products.* FROM products JOIN categories ON products.category_id=categories.id WHERE products.gender='female' AND categories.category ILIKE $1 ORDER BY id ASC LIMIT 10 OFFSET ${offset}`;

    try {
        const products = await MakeQuery(SQL,[categorySQL]);

        res.status(200).json({
            products,
            noProducts: products.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

products.getLastRelease = async (req,res) => {
    const SQL = `SELECT * FROM products ORDER BY created_at DESC LIMIT 4`;

    try {
        const products = await MakeQuery(SQL);

        res.status(200).json({
            products,
            noProducts: products.length < 1
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:true,
            message:'Something went wrong... please wait'
        });
    }
}

export default products;