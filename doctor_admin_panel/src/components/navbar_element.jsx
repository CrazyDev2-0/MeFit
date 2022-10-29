import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink } from "react-router-dom";

const NavbarElement = (props) => {
  return (
    <>
      <NavLink to={props.to} >
            <div className={"navbarElement " + (props.isActive ? "activeNavbar" : "")}>
                <div className="icon"><FontAwesomeIcon icon={props.icon} color={props.isActive ? "white" : "grey"}/></div>
                <p>{props.text}</p>
            </div>
      </NavLink>
    </>
  );
};

export default NavbarElement;
