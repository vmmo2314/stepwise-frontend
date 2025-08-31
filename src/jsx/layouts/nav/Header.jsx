import React, { useContext } from "react"; import { Link } from "react-router-dom"; import LogoutLink from './Logout'; import { Dropdown } from "react-bootstrap";

import avatar from "../../../assets/images/avatar/1.jpg";

import { ThemeContext } from "../../../context/ThemeContext";
import { useAuthUser } from "../../../services/CurrentAuth";

// ==== Utilidades: iniciales y color estable por nombre/email ====
const getInitials = (nameOrEmail = "") => {
  const base = String(nameOrEmail).trim();
  if (!base) return "US";
  // Si es email, toma la parte antes de @ para generar iniciales
  const safe = base.includes("@") ? base.split("@")[0] : base;
  const parts = safe.replace(/\s+/g, " ").split(" ");
  if (parts.length === 1) {
    const p = parts[0];
    return (p[0] + (p[1] || "")).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const hashString = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
};

const stringToHsl = (str) => {
  const h = hashString(str) % 360;
  const s = 65; // saturación
  const l = 54; // luminosidad
  return `hsl(${h} ${s}% ${l}%)`;
};

const AvatarCircle = ({ name, email, size = 28 }) => {
  const label = name?.trim() || email || "Usuario";
  const initials = getInitials(label);
  const bg = stringToHsl(label);
  const style = {
    width: size,
    height: size,
    borderRadius: "9999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: Math.max(12, Math.floor(size * 0.45)),
    letterSpacing: ".5px",
    background: bg,
    color: "#fff",
    textTransform: "uppercase",
    boxShadow: "0 1px 2px rgba(0,0,0,.12)",
    userSelect: "none",
    flexShrink: 0,
  };
  return <span style={style} aria-label={label}>{initials}</span>;
};

const Header = ({ onNote, toggle, onProfile, onNotification, onBox }) => {
  const { background, changeBackground } = useContext(ThemeContext);

  // ⬇️ Obtenemos usuario autenticado desde tu servicio
  const auth = useAuthUser?.() || {};
  // Intenta distintas propiedades comunes: displayName/name/email
  const displayName =
    auth?.displayName || auth?.name || auth?.fullName || auth?.email || "Usuario";
  const firstName = String(displayName).split(" ")[0];
  const email = auth?.email || "";

  function handleDarkMode() {
    if (background.value == "light") {
      changeBackground({ value: "dark", label: "Dark" });
    } else {
      changeBackground({ value: "light", label: "Light" });
    }
  }

  // (Se mantiene tu lógica de título)
  var path = window.location.pathname.split("/");
  var name = path[path.length - 1].split("-");
  var filterName = name.length >= 3 ? name.filter((n, i) => i > 0) : name;
  var finalName = filterName.includes("app")
    ? filterName.filter((f) => f !== "app")
    : filterName.includes("ui")
    ? filterName.filter((f) => f !== "ui")
    : filterName.includes("uc")
    ? filterName.filter((f) => f !== "uc")
    : filterName.includes("basic")
    ? filterName.filter((f) => f !== "basic")
    : filterName.includes("form")
    ? filterName.filter((f) => f !== "form")
    : filterName.includes("table")
    ? filterName.filter((f) => f !== "table")
    : filterName.includes("page")
    ? filterName.filter((f) => f !== "page")
    : filterName.includes("email")
    ? filterName.filter((f) => f !== "email")
    : filterName.includes("ecom")
    ? filterName.filter((f) => f !== "ecom")
    : filterName.includes("chart")
    ? filterName.filter((f) => f !== "chart")
    : filterName.includes("editor")
    ? filterName.filter((f) => f !== "editor")
    : filterName;

   return (
      <div className="header">
         <div className="header-content">
            <nav className="navbar navbar-expand">
               <div className="collapse navbar-collapse justify-content-between">
                  <div className="header-left">
                     <div
                        className="dashboard_bar"
                        style={{ textTransform: "capitalize" }}
                     >
                        {finalName.join(" ")}
                     </div>
                  </div>
                  <ul className="navbar-nav header-right">
                     <li className="nav-item dropdown notification_dropdown">
                        <Link to={"#"} className={`nav-link bell dz-theme-mode ${background.value === "light" ? 'active': ''}`}
                           onClick={handleDarkMode}
                        >
                           <i className="fas fa-sun light"/>
                           <i className="fas fa-moon dark" />
                        </Link>
							</li>
                     <Dropdown as="li" className="nav-item header-profile">
                     <Dropdown.Toggle
                        as="a"
                        className="nav-link i-false d-inline-flex align-items-center gap-2 py-2 px-3 rounded-pill"
                     >
                        {/* Avatar dinámico con iniciales (aumenta el tamaño desde el prop) */}
                        <AvatarCircle name={displayName} email={email} size={32} />

                        {/* Texto compacto y legible, sin inline styles */}
                        <div className="header-info d-flex align-items-center">
                           <span className="d-inline-block text-truncate fw-semibold" title={displayName} style={{maxWidth: 'unset'}}>
                           Hola, <strong>{firstName}</strong>
                           </span>
                        </div>
                     </Dropdown.Toggle>

                     <Dropdown.Menu align="end" className="dropdown-menu-right">
                        <Link to="/app-profile" className="dropdown-item ai-icon">
                           <svg
                           id="icon-user1"
                           xmlns="http://www.w3.org/2000/svg"
                           className="text-primary"
                           width={18}
                           height={18}
                           viewBox="0 0 24 24"
                           fill="none"
                           stroke="currentColor"
                           strokeWidth={2}
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           >
                           <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                           <circle cx={12} cy={7} r={4} />
                           </svg>
                           <span className="ms-2">Perfil</span>
                        </Link>
                        <LogoutLink />
                     </Dropdown.Menu>
                     </Dropdown>
                  </ul>
               </div>
            </nav>
         </div>
      </div>
   );
};

export default Header;