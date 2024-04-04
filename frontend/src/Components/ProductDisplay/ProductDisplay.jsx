import React, { useContext, useState } from 'react';
import './ProductDisplay.css'
import { ShopContext } from "../Context/ShopContext";
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";

const ProductDisplay = (props) => {
    const { product } = props;
    const { addToCart } = useContext(ShopContext);
    const [selectedSize, setSelectedSize] = useState(null);

    const handleSizeSelect = (size) => {
        setSelectedSize(size);
    };

    return (
        <div className='productdisplay'>
            <div className="productdisplay-left">
                <div className="productdisplay-img">
                    <img className='productdisplay-main-img' src={product.image} alt="" />
                </div>
            </div>
            <div className="productdisplay-right">
                <h1>{product.name}</h1>
                <div className="productdisplay-right-star">
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_dull_icon} alt="" />
                    <p>(122)</p>
                </div>
                <div className="productdisplay-right-prices">
                    <div className="productdisplay-right-price-old">${product.old_price}</div>
                    <div className="productdisplay-right-price-new">${product.new_price}</div>
                </div>
                <div className="productdisplay-right-description">
                    {/* Aquí puedes agregar la descripción del producto si es necesario */}
                </div>
                <div className="productdisplay-right-size">
    <h1>Select Size</h1>
    <ul className="size-options">
        <li onClick={() => handleSizeSelect('S')}>S</li>
        <li onClick={() => handleSizeSelect('M')}>M</li>
        <li onClick={() => handleSizeSelect('L')}>L</li>
        <li onClick={() => handleSizeSelect('XL')}>XL</li>
        <li onClick={() => handleSizeSelect('XXL')}>XXL</li>
    </ul>
</div>
                <button onClick={() => addToCart(product.id, selectedSize)}>ADD TO CART</button>
                <p className='productdisplay-right-category'><span>Category :</span>Women , T-Shirt, Crop Top </p>
                <p className='productdisplay-right-category'><span>Tags :</span>Modern, Latest</p>
            </div>
        </div>
    )
}

export default ProductDisplay;

