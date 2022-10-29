import React, { useEffect } from "react";
import logo from "../assets/logo.png";
import { faBars, faBell, faSignOut} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IconButton,
} from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

const TopBar = () => {

  useEffect(() => {
    console.log("TopBar mounted");
  }, []);

  return (
    <>
      <div className="topBar">
        <IconButton
          aria-label="Open navbar"
          onClick={() => {localStorage.clear();window.location.href = '/';}}
          icon={<FontAwesomeIcon icon={faSignOut} fontSize="20" />}
        />

        <NavLink to="/">      
          <div className="branding">
            <img src={logo} alt="logo" />
            <p>MeFit - Doctor portal</p>
          </div>
        </NavLink>
        <IconButton
          aria-label="Open navbar"
          onClick={() => document.openAlertBar()}
          icon={<FontAwesomeIcon icon={faBell} fontSize="20" />}
        />
      </div>
    </>
  );
};

export default TopBar;
