import React from 'React' 6.9k (gzipped: 2.7k)
import './Hero.css'
import hand_icon from '../Assets/hand_icon.png'
import arrow_icon from '../Assets/arrow.png'
import hero_image from '../Assets/hero_image.png'
const Hero = () => {
    return (
        <div ClassName='hero'>
            <div ClassName= "hero-left">
            <h2>SOLO NUEVAS LLEGADAS</h2>
            <div>
            <div ClassName="hand-hand-icon">
                <p>nuevo</p>
                <img src={hand_icon} alt="" />
            </div>
            <p>colecciones</p>
            <p>Para todos</p>
            </div>
            <div ClassName="hero-latest-btn">
                <div>última colección</div>
                <img src="" alt="" />
            </div>
           </div>
           <div ClassName="hero-right">
                <img src={hero_image} alt="" />
           </div>
        </div>
    )
}
export default Hero

