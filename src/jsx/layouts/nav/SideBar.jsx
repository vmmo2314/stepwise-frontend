import React, { Fragment, useEffect,  useReducer, useState } from "react";
import {Collapse} from 'react-bootstrap';
import { Link } from "react-router-dom";
import {MenuList} from './Menu';
import { useSelector } from "react-redux";

const reducer = (previousState, updatedState) => ({
  ...previousState,
  ...updatedState,
});

const initialState = {
  active : "",
  activeSubmenu : "",
}

const SideBar = () => {
  const dat = new Date();
  const rol = useSelector(state => state.auth.auth?.rol);
  const [state, setState] = useReducer(reducer, initialState);

  const [heartBtn, setHeartBtn] = useState();
   
    const handleMenuActive = status => {		
      setState({active : status});			
      if(state.active === status){				
        setState({active : ""});
      }   
    }
    const handleSubmenuActive = (status) => {		
      setState({activeSubmenu : status})
      if(state.activeSubmenu === status){
        setState({activeSubmenu : ""})			
      }    
    }
    // Menu dropdown list End

    /// Path
    let path = window.location.pathname;
    path = path.split("/");
    path = path[path.length - 1];

    useEffect(() => {
      // Resetear estados al inicio
      let newState = { active: "", activeSubmenu: "" };
      
      MenuList.forEach((data) => {
        // Verificar si la ruta actual coincide directamente con el elemento del menú principal
        if (data.to === path) {
          newState.active = data.title;
          return;
        }
        
        data.content?.forEach((item) => {
          if (path === item.to) {
            newState.active = data.title;
            // Solo establecer activeSubmenu si no tiene contenido (no es un submenú)
            if (!item.content || item.content.length === 0) {
              newState.activeSubmenu = "";
            }
          }
          item.content?.forEach(ele => {
            if (path === ele.to) {
              newState.activeSubmenu = item.title;
              newState.active = data.title;
            }
          })
        })
      });
      
      setState(newState);
    }, [path]);

    return (
      <div className="deznav">
        <div className="deznav-scroll">
          <ul className="metismenu" id="menu">
            {MenuList.filter(data => !data.roles || data.roles.includes(rol)).map((data, index)=>{
                let menuClass = data.classsChange;
                  if(menuClass === "menu-title"){
                    return(
                        <li className={menuClass}  key={index} >{data.title}</li>
                    )
                  }else{
                    return(				
                      <li className={`has-menu ${ state.active === data.title ? 'mm-active' : ''} ${data.to === path ? 'mm-active' : ''}`}
                        key={index} 
                      >
                        
                        {data.content && data.content.length > 0 ?
                            <Fragment>
                              <Link to={"#"} 
                                className="has-arrow ai-icon"
                                onClick={() => {handleMenuActive(data.title)}}
                              >								
                                  {data.iconStyle}{" "}
                                  <span className="nav-text">{data.title}</span>
                              </Link>                          
                              <Collapse in={state.active === data.title ? true :false}>
                                <ul className={`${menuClass === "mm-collapse" ? "mm-show" : ""}`}>
                                  {data.content && data.content.map((data,index) => {									
                                    return(	
                                      <li key={index}
                                        className={`${ state.activeSubmenu === data.title ? "mm-active" : ""}`}                                    
                                      >
                                        {data.content && data.content.length > 0 ?
                                            <>
                                              <Link to={data.to} className={data.hasMenu ? 'has-arrow' : ''}
                                                onClick={() => { handleSubmenuActive(data.title)}}
                                              >
                                                {data.title}
                                              </Link>
                                              <Collapse in={state.activeSubmenu === data.title ? true :false}>
                                                  <ul className={`${menuClass === "mm-collapse" ? "mm-show" : ""} ${data.to === path ? 'mm-active' : ''}`}>
                                                    {data.content && data.content
                                                    .filter(sub => !sub.roles || sub.roles.includes(rol))
                                                    .map((data,index) => {
                                                      return(	                                                    
                                                        <li key={index}>
                                                          <Link className={`${path === data.to ? "mm-active" : ""}`} to={data.to}>{data.title}</Link>
                                                        </li>
                                                        
                                                      )
                                                    })}
                                                  </ul>
                                              </Collapse>
                                            </>
                                          :
                                          <Link to={data.to} className={`${data.to === path ? 'mm-active' : ''}`}>
                                            {data.title}
                                          </Link>
                                        }                                    
                                      </li>                               
                                    )
                                  })}
                                </ul>
                              </Collapse>
                            </Fragment>
                          :
                          <Link  to={data.to} >
                              {data.iconStyle}{" "}
                              <span className="nav-text">{data.title}</span>
                          </Link>
                        }
                      </li>	
                    )
                }
            })}  
          </ul>         

          <div className="copyright">
            <p>
              <strong>stepwise</strong> © {dat.getFullYear()} Todos
              los derechos reservados
            </p>
            <p>
              Hecho con {" "}
              <span
                className={`heart ${heartBtn ? 'heart-blast' : ''}`}                
                onClick={()=>setHeartBtn(!heartBtn)}
              ></span>{" "}
              por el equipo de stepwise
            </p>
          </div>
			  </div>
      </div>
    );
  
}

export default SideBar;