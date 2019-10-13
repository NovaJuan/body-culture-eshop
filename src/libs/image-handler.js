import jimp from 'jimp';
import path from 'path';

const imageHandler = async (req,res,next) => {
    if(req.file){
        jimp.read(req.file.path)
            .then(image => {
                const dividedFilename = req.file.filename.split('.');

                // req.file.main_url = `/public/product-images/main/${dividedFilename[0]}.${dividedFilename[1]}`;

                image.contain(1500,1500).background(0xFFFFFFFF).write(path.join(__dirname,`../../public/product-images/card/${dividedFilename[0]}.jpg`));
                req.file.main_url = `/public/product-images/card/${dividedFilename[0]}.jpg`

                //card image;
                image.contain(500,500).background(0xFFFFFFFF).quality(60).write(path.join(__dirname,`../../public/product-images/card/${dividedFilename[0]}_card.jpg`));
                req.file.card_url = `/public/product-images/card/${dividedFilename[0]}_card.jpg`
    
                //creating thumbnail
                image.contain(100,100).background(0xFFFFFFFF).quality(30).write(path.join(__dirname,`../../public/product-images/thumbnails/${dividedFilename[0]}_thumbnail.jpg`));
                req.file.thumbnail_url = `/public/product-images/thumbnails/${dividedFilename[0]}_thumbnail.jpg`
    
                next();
            })
            .catch(err => {
                console.log(err);
                res.status(500).send('Something went wrong');
            });
    }else{
        next();
    }
}

export default imageHandler;