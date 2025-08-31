import React, { useState } from "react";
import { useDispatch , useSelector } from 'react-redux';
/// React router dom
import { Link } from "react-router-dom";
import { navtoggle } from "../../../store/actions/AuthActions";

/// images
import logo from "../../../assets/images/logo.png";
import logoText from "../../../assets/images/logo-text.png";

const NavHader = () => {   
   const dispatch = useDispatch();
   const sideMenu = useSelector(state => state.sideMenu);
   const handleToogle = () => {
     dispatch(navtoggle());
   };
   return (
      
   <div className="nav-header">
      {/* 1) ESTILOS LOCALES DEL TÍTULO TRICOLOR */}
      <Link to="#" className="brand-logo">
         <img className="logo-abbr" src={logo} alt="" />
         <img className="logo-compact" src={logoText} alt="" />

         {/* 2) === REEMPLAZO DEL TÍTULO === */}
         <span
         className="brand-title"
         style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: "2rem",
            lineHeight: 1,
            letterSpacing: ".5px",
            color: "#16a34a", // VERDE principal
            // Desfase armónico: azul arriba-izquierda, verde centro, amarillo abajo-derecha
            textShadow: "-3px -3px 0 #2563eb, -6px -6px 0 #facc15",
         }}
         >
         STEPWISE
         </span>
         {/* === FIN REEMPLAZO === */}
      </Link>

      <div className="nav-control" onClick={() => handleToogle()}>
         <div className={`hamburger ${sideMenu ? "is-active" : ""}`}>
         <span className="line"></span>
         <span className="line"></span>
         <span className="line"></span>
         </div>
      </div>
   </div>
   );
};

export default NavHader;
