import React from 'react' 
import './CSS/LoginSignup.css'
const LoginSignup = () => {
    return (
        <div className= 'loginsignup'>
            <div className= "loginsignup-container">
            <h1>sign Up</h1>
            <div className= "loginsignup-fields">
                <input type="text" placeholder='your Name'/>
                <input type="email" placeholder='Email Address'/>
                <input type="password" placeholder='Password'/>
            </div>
            <button>Continuar</button>
            <p className='loginsignup-login'>¿Ya tienes una cuenta? <spain>ingrese aqui</spain></p>
            <div className="loginsignup-agree">
                <input type="checkbox" name='' id= ''/>
                <p>Al continuar, acepto los términos de uso y la política de privacidad.</p>
            </div>
            </div>
        </div>
    )
}
export default LoginSignup
