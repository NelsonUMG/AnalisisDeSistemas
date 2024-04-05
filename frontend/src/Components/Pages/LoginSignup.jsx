import React from 'react' 
import './CSS/LoginSignup.css'
const LoginSignup = () => {
    const [state,setState] = useState("Login");
    const [formData,setFormData] = useState({
        username:"",
        password:"",
        email:""
    })

    const changeHandler = (e) => {
        setFormData({...formData, [e.target.name]:e.target.value})
    }

    const login = async () =>{
        console.log("Login Function Executed", formData);
        let responseData;
        await fetch('http://localhost:4000/login',{
            method:'POST',
            headers:{
                Accept: 'application/form-data',
                'Content-Type' : 'application/json',
            },
            body: JSON.stringify(formData),
        }).then ((response)=> response.json()).then((data)=>responseData=data)

        if(responseData.success){
            localStorage.setItem('auth-token',responseData.token);
            window.location.replace("/");
        }
        else{
            alert(responseData.errors)
        }
    }

    const signup = async () =>{
        console.log("Signup Function Executed", formData);
        let responseData;
        await fetch('http://localhost:4000/signup',{
            method:'POST',
            headers:{
                Accept: 'application/form-data',
                'Content-Type' : 'application/json',
            },
            body: JSON.stringify(formData),
        }).then ((response)=> response.json()).then((data)=>responseData=data)

        if(responseData.success){
            localStorage.setItem('auth-token',responseData.token);
            window.location.replace("/");
        }
        else{
            alert(responseData.errors)
        }
    }


    return (
        <div className= 'loginsignup'>
            <div className= "loginsignup-container">
            <h1>state</h1>
            <div className= "loginsignup-fields">
               {state==="Sign up"?<input name='username' value={formData.username} onChange={changeHandler} type="text" placeholder='your Name'/>:<></>}
                <input name='email' value={formData.email} onChange={changeHandler} type="email" placeholder='Email Address'/>
                <input name='password' value={formData.password} onChange={changeHandler} type="password" placeholder='Password'/>
            </div>
            <button onClick={()=>{state==="Login"?login():signup()}}> Continuar</button>
            {state=== "Sign up"?<p className='loginsignup-login'>¿Ya tienes una cuenta? <spain onClick ={()=>{setState("Login")}}>ingrese aqui</spain></p>
            :<p className='loginsignup-login'>¿Crear una cuenta? <spain onClick = {()=>{setState("Sign Up")}}>Has Clic aquí</spain ></p>}
            <div className="loginsignup-agree">
                <input type="checkbox" name='' id= ''/>
                <p>Al continuar, acepto los términos de uso y la política de privacidad.</p>
            </div>
            </div>
        </div>
    )
}
export default LoginSignup

