window.onload = () => {
    let price = document.getElementById('price');
    let oldPrice = price.getAttribute('data-old');
    let discountPrice = document.getElementById('discount-price');
    let discountPercent = document.getElementById('discount-percent');

    price.addEventListener('input',changePrice);
    function changePrice (){
        if(parseFloat(price.value) % 1 !== 0){
            price.value = Math.round(price.value);
        }

        if(price.value === '0'){
            discountPercent.value = '';
        }

        if(discountPercent.value !== '' || discountPercent.value !== '0'){
            setByPercent();
        }
    }

    discountPercent.addEventListener('input',setByPercent);
    function setByPercent(e){
        if(parseFloat(discountPercent.value) % 1 !== 0){
            discountPercent.value = Math.round(discountPercent.value);
        }

        let value = Math.round(discountPercent.value);
        let currentPrice = Math.round(price.value); 

        if(!currentPrice){
            currentPrice = Math.round(oldPrice);
        }
        if(!value){
            return discountPrice.value = '';
        }

        if(value > 100){
            discountPercent.value = '100';
            value = 100;
            return discountPrice.value = '0';
        }

        if(value < 0){
            discountPercent.value = '0';
            value = 0;
            return discountPrice.value = '';
        }

        discountPrice.value = currentPrice - Math.round((value * currentPrice) / 100);
    }

    discountPrice.addEventListener('input',setByPrice);
    function setByPrice(e){
        if(parseFloat(discountPrice.value) % 1 !== 0){
            discountPrice.value = Math.round(discountPrice.value);
        }

        let value = Math.round(discountPrice.value);
        let currentPrice = Math.round(price.value); 

        if(!currentPrice){
            currentPrice = Math.round(oldPrice);
        }

        if(value > currentPrice){
            discountPrice.value = currentPrice;
            value = currentPrice;
        }

        if(!value){
            return discountPercent.value = '';
        }

        discountPercent.value = 100 - Math.round((Math.round(value) * 100) / currentPrice);
        if(discountPercent.value === '0' && value === currentPrice){
            discountPercent.value = '100';
        }
    }
}