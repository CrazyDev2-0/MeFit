import React from "react";
import logo from "../assets/logo.png";
import NavbarElement from "../components/navbar_element";
import { faPerson, faGear,  faClose, faHome } from '@fortawesome/free-solid-svg-icons'
import { IconButton } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Navbar = ()=>{

    return(
    <>
    <nav className="navbarContainer">
        <div style={{float: "right"}}><IconButton aria-label='' onClick={()=>document.closeNavbar()} icon={<FontAwesomeIcon icon={faClose} fontSize={20} />} /></div>
        <div className="systemDetails">
            <img src={logo} alt="logo" />
            <p>Vital Monitoring</p>
        </div>
        <div className="divider"></div>
        <div className="navbarContent">
            <NavbarElement to="/" icon={faHome} text="Home" isActive={false} />
            <NavbarElement to="/patients" icon={faPerson} text="Patient Management" isActive={true} />
            <NavbarElement to="/" icon={faGear} text="Logout" />
        </div>
    </nav>
    </>);
}

export default Navbar;