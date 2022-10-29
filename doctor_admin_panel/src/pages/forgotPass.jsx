import React, { useRef } from "react";
import logo from "../assets/logo_light.png";
import axios from "axios";
import Swal from "sweetalert2";

const BASEURL = 'https://stratathonapi.tanmoy.codes';
const LoginPage = () => {
  // Login form state
  const formRef = useRef({
    email: ""
  });


  // Handle login form submit
  async function handleSubmit() { 
    try {
        document.showLoadingScreen();
        const data = await axios({
        method: 'post',
        url: `${BASEURL}/auth/reset-password-doctor`,
        headers: { 
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(formRef.current)
        });
        document.hideLoadingScreen();
        console.log(data);
        const resJSon = data.data;
        Swal.fire(
          resJSon.success ? "New Password has been sent to your Email" : "Email is not registered with us",
          resJSon.message,
          resJSon.success ? 'success' : "error"
        )
        if(resJSon.success) window.location.href = '/';
        
      } catch (error) {
        console.log(error);
        document.hideLoadingScreen();
        Swal.fire(
          "Error",
          "Some error occured...",
          "error"
        )
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

            <h3>Reset your Password ✌</h3>
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
            <button className="loginBtn" onClick={() => { handleSubmit(); } }>
              Change Password
            </button>
          </div>
          <div className="left">
            <div className="glasspanel">
                <img src={logo} alt="" />
              <p>Vital Monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
