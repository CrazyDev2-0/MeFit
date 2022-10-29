import React, { useRef } from "react";
import logo from "../assets/logo_light.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { getToken, getMessaging } from "firebase/messaging";
import firebaseapp from "../firebase";

const requestPermission = async () => {
  console.log('Requesting permission...');
  try {    
    if ((await Notification.requestPermission()) == 'granted') {      
      const messaging = getMessaging(firebaseapp);
      const fcmToken = await getToken(messaging, { vapidKey: 'BLVY-Cc28TMBaAYYF-7OhMhvkDWx9HuEprqwWg-PSwUB9FGlBzL0oPcrWg09ZK4tWswiAIUnMdCj_tCDAn8CvcI' });
      
      if(fcmToken)  return fcmToken;
    }
  } catch (error) {
    console.log("error in fcmtoken generation", error)
  }
  return null;  
}

const BASEURL = 'https://stratathonapi.tanmoy.codes';
const LoginPage = () => {
  const navigate = useNavigate();
  // Login form state
  const formRef = useRef({
    email: "",
    password: ""
  });


  // Handle login form submit
  async function handleSubmit() {    
    const fcmtoken = await requestPermission();
    if(fcmtoken)  {
      formRef.current["fcmToken"] = fcmtoken;
    }
    const data = await axios({
      method: 'post',
      url: `${BASEURL}/auth/login-doctor`,
      headers: { 
        'Content-Type': 'application/json'
      },
      data : JSON.stringify(formRef.current)
    });
    // console.log(data.data.code);
    if(data.data.code === 200)  {   
      localStorage.setItem('token', data.data.payload.token);
      localStorage.setItem('profile', JSON.stringify(data.data.payload));
      window.location.href="/";
      // navigate("/", {replace: true});
    }else {
      Swal.fire(
        "Error",
        "Invalid Login credentials...",
        "error"
      )
      console.log("Incorrect Login Credentials");
    }
  }


  return (
    <>
      {/* /Main content */}

      <div className="loginContainer">
        <div className="loginMainContainer" spacing={0}>
          <div className="right">
            <div className="basic_details">
            <img src={logo} alt="" />
            </div>

            <h3>Login yourself ✌</h3>
            <div className="form-input">
              <p>E-mail ID</p>
              <input
                type="email"
                placeholder="Enter registered email id"
                onChange={(e) => {
                  formRef.current["email"] = e.target.value;
                }}
              />
            </div>
            <div className="form-input">
              <p>Password</p>
              <input
                type="password"
                placeholder="Enter password"
                onChange={(e) => {
                  formRef.current["password"] = e.target.value;
                }}
              />
            </div>
            <button className="loginBtn" onClick={() => handleSubmit()}>
              Login
            </button>            
            <button className="loginBtn" onClick={() => { window.location.href = '/forpass' } }>
              Forgot Password
            </button>
          </div>
          <div className="left">
            <div className="glasspanel">
                <img src={logo} alt="" />
              <p>MeFit - Doctor portal</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
