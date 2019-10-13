window.onload = () => {
    const mainInput = document.getElementById('input-search');
    const inputByID = document.getElementById('input-byId');
    const inputByPrice = document.getElementById('input-byPrice');
    const list = document.getElementById('products-list');
    const discountList = document.getElementById('discount-list');
    const upload_discount = document.getElementById('upload-discount')
    const clear_list = document.getElementById('clear-list');
    let productsOnSearchList = [];
    let productsOnDiscountList = [];


    var typingTimeout = null;
    mainInput.addEventListener('input',(e) => {
        const value = e.target.value;
        inputByID.value = '';
        inputByPrice.value = '';

        if(value){
            list.innerHTML = '<li class="list-group-item rouded-0 text-center">Loading...</li>';
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => fetchProducts(value), 500);
        }
    });
    inputByID.addEventListener('input',(e) => {
        const value = e.target.value;
        mainInput.value = '';
        inputByPrice.value = '';

        if(value){
            list.innerHTML = '<li class="list-group-item rouded-0 text-center">Loading...</li>';
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => fetchProducts(`${value}?type=id`), 500);
        }
    });
    inputByPrice.addEventListener('input',(e) => {
        const value = e.target.value;
        mainInput.value = '';
        inputByID.value = '';

        if(value){
            list.innerHTML = '<li class="list-group-item rouded-0 text-center">Loading...</li>';
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => fetchProducts(`${value}?type=price`), 500);
        }
    });

    function fetchProducts(value) {
        fetch(`/api/admin/search/${value}`,{
            method:'get',
            headers:{
                'Content-Type':'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            list.innerHTML = null;

            productsOnSearchlist = [];

            const {products} = data;

            if(products.length < 1){
                productsOnSearchlist = [];
                return insertInList(null);
            }

            productsOnSearchList = products;
            for(var i = 0; i < products.length;i++){
                insertInList(products[i]);
            }
            setEventListeners();
        })
        .catch(err => {
            console.log(err);
            list.innerHTML = '<li class="list-group-item rounded-0 text-center text-danger">Something went wrong</li>'
        });
    }

    function insertInList(product) {
        if(product){
            const productElement = document.createElement('li');
            productElement.className = 'list-group-item list-group-item-action rounded-0 product-searched';

            const productText = document.createTextNode(`ID: ${product.id} | ${product.name}`);
            
            productElement.setAttribute('data-id',product.id);

            productElement.appendChild(productText);
    
            list.appendChild(productElement);
        }else{
            const productElement = document.createElement('li');
            productElement.className = 'list-group-item list-group-item-action rounded-0';
            const productText = document.createTextNode(`No products found`);
            productElement.appendChild(productText);
    
            list.appendChild(productElement);
        }
    }

    function setEventListeners() {
        const productsSearched = document.getElementsByClassName('product-searched');
        for(let i = 0;i < productsSearched.length;i++){
            productsSearched[i].addEventListener('click',addProductToDiscountList);
        }
        
        const productsDiscounted = document.getElementsByClassName('onlist');
        for(let i = 0;i < productsDiscounted.length;i++){
            productsDiscounted[i].addEventListener('click',removeProductFromDiscountList);
        }
    }

    function addProductToDiscountList(e) {
        const productID = parseInt(e.target.getAttribute('data-id'));
        let productItem = null;

        for(let i = 0; i < productsOnSearchList.length;i++){
            if(productsOnSearchList[i].id === productID){
                productItem = productsOnSearchList[i];
            }
        }

        let isAlreadyOnDiscountList = false;
        for(let i = 0; i < productsOnDiscountList.length;i++){
            const onList = productsOnDiscountList[i].id === productID;
            if(onList){
                isAlreadyOnDiscountList = true;
            }
        }

        if(!isAlreadyOnDiscountList){
            productsOnDiscountList.push(productItem)

            const newDiscount =  document.createElement('li');
            newDiscount.className = 'list-group-item onlist';

            const discountText = document.createTextNode(`ID: ${productItem.id} | ${productItem.name}`);
            newDiscount.appendChild(discountText);

            newDiscount.setAttribute('data-id',productItem.id)

            discountList.appendChild(newDiscount);

            setEventListeners();
        }
    }

    function removeProductFromDiscountList(e) {
        discountList.innerHTML = '';

        const productID = parseInt(e.target.getAttribute('data-id'));
        
        let newProductsOnDiscountList = [];
        for(let i=0; i < productsOnDiscountList.length;i++){
            if(productsOnDiscountList[i].id !== productID){
                newProductsOnDiscountList.push(productsOnDiscountList[i]);
            }
        }
        productsOnDiscountList = newProductsOnDiscountList;
        
        for(let i=0; i < productsOnDiscountList.length;i++){
            const newDiscount =  document.createElement('li');
            newDiscount.className = 'list-group-item onlist';

            const discountText = document.createTextNode(`ID: ${productsOnDiscountList[i].id} | ${productsOnDiscountList[i].name}`);
            newDiscount.appendChild(discountText);

            newDiscount.setAttribute('data-id',productsOnDiscountList[i].id)

            discountList.appendChild(newDiscount);
        }

        setEventListeners();
    }

    upload_discount.addEventListener('click',uploadDiscount);
    function uploadDiscount() {
        const _csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        let discountPercent = parseInt(document.getElementById('discount-percent').value);
        let discountIDs = [];

        if(discountPercent < 0){
            discountPercent = discountPercent * -1;
        }
        
        if(productsOnDiscountList.length < 1){
            return alert('No products on discount list.');
        }

        if(!discountPercent){
            return alert('No discount percent.');
        }

        for (let i = 0; i < productsOnDiscountList.length; i++) {
            discountIDs.push(productsOnDiscountList[i].id);
        }

        const discount = parseInt(discountPercent);

        fetch('/api/admin/discount',{
            method:'post',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                _csrf,
                discount,
                discountIDs
            })
        }).then(res => res.json())
          .then(data => {
              if(data.error){
                return console.log(data.message);
              }
              window.location = '/api/admin';
          })
          .catch(err => console.log(err));        

    }
    
    clear_list.addEventListener('click',clearDiscount);
    function clearDiscount(){
        document.getElementById('discount-percent').value = '';
        discountList.innerHTML = '';
        productsOnDiscountList = [];
    }
}