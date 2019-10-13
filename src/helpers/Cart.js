//Function to detect

export default class Cart {
    constructor(oldCart = false){
        if(oldCart){
            oldCart = oldCart;
            this.items = oldCart.items;
            this.productsCount = oldCart.productsCount;
            this.totalPrice = oldCart.totalPrice;
            this.totalQty = oldCart.totalQty;
        }else{
            this.items = {};
            this.productsCount = 0;
            this.totalPrice = 0;
            this.totalQty = 0;
        }
    }

    addItem(newItem){     
        if(this.productsCount > 0){
            //PROCESS TO VERIFY IF EXISTS AN ITEM WITH THE SAME PROPERTIES TO SET NEW PRICE AND QUANTITY TO THAT ITEM  
            // First, turn the cart items object on a array that each item is transformed into an array [key,value] 
            const itemsBigArray = Object.entries(this.items);

            // Then we loop on the main array to get each item (the item that is an array too)
            for(const itemArray of itemsBigArray){
                //We get the value of the item
                const oldItem = itemArray[1];

                // Now verify if the new item has the same properties of any old item 
                if(oldItem.id === newItem.id && oldItem.size === newItem.size && oldItem.color === newItem.color){
                    //Sum the old product price with the new item price 
                    this.items[itemArray[0]].qty += newItem.qty;

                    //Sum the old quantity with the new item's
                    this.items[itemArray[0]].total_product_price +=  newItem.price * newItem.qty;
                    this.items[itemArray[0]].total_product_price = parseFloat(this.items[itemArray[0]].total_product_price.toFixed(2));

                    //Sum the new item's price to the total cart price
                    this.totalPrice += newItem.price * newItem.qty;
                    this.totalPrice = parseFloat(this.totalPrice.toFixed(2));


                    //And the same with the quantity
                    this.totalQty += parseInt(newItem.qty);
                    return;
                }
                
            }
        }
        
        //And if there's not a product with the same properties, just add a new one
        //Increase the products count 
        this.productsCount += 1;
        
        //Use Date.now() as the key of the new product
        const key = Date.now();

        const itemSetup = {
            key:key,
            id:newItem.id,
            name:newItem.name,
            thumbnail_url:newItem.thumbnail_url,
            qty:newItem.qty,
            size:newItem.size,
            color:newItem.color,
            individual_price:parseFloat(newItem.price),
            total_product_price:parseFloat((newItem.price * newItem.qty).toFixed(2))
        }


        this.items[key] = new Object();

        //Set all properties 
        this.items[key] = itemSetup;

        //Sum the new item's price to the total cart price
        this.totalPrice += newItem.price * newItem.qty;
        this.totalPrice = parseFloat(this.totalPrice.toFixed(2));

        //And the same with the quantity
        this.totalQty += newItem.qty;
    }

    getCartObject(){
        const cart = {
            items:this.items,
            productsCount:this.productsCount,
            totalPrice:this.totalPrice,
            totalQty:this.totalQty
        }
        return cart;
    }

    getItemsInArray(){
        const cart = {
            items: Object.values(this.items),
            productsCount:this.productsCount,
            totalPrice:this.totalPrice,
            totalQty:this.totalQty
        }
        return cart;
    }

    reduceOneItem(key){
        const item = this.items[key];
        if(item){
            this.items[key].total_product_price -= item.individual_price;
            this.items[key].qty--;
            this.totalPrice -= item.individual_price;
            this.totalPrice = parseFloat(this.totalPrice.toFixed(2));
            this.totalQty--;
            if(this.items[key].qty < 1){
                delete this.items[key];
                this.productsCount--;
            }
        }
    }

    addOneItem(key){
        const item = this.items[key];
        if(item){
            this.items[key].total_product_price += item.individual_price;
            this.items[key].qty++;
            this.totalPrice += item.individual_price;
            this.totalPrice = parseFloat(this.totalPrice.toFixed(2));
            this.totalQty++;
        }
    }

    removeItem(key){
        const item = this.items[key];
        if(item){
            this.totalPrice -= item.total_product_price;
            this.totalPrice = parseFloat(this.totalPrice.toFixed(2));
            this.totalQty -= item.qty;
            this.productsCount--;
            delete this.items[key];
        }
    }
}