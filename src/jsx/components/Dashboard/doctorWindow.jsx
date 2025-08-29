import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../../context/ThemeContext";
import { FaUserInjured, FaStethoscope, FaUsers, FaChevronRight, FaStar, FaDotCircle, FaInfo } from "react-icons/fa";

// Estilos del menú
import "./dashboardCss/gameModeSelection.css";

const Home = () => {
   const navigate = useNavigate();
   const { changeBackground, theme } = useContext(ThemeContext);
   const [isTransitioning, setIsTransitioning] = useState(false);
   const [selected, setSelected] = useState(null);
   const [isAnimating, setIsAnimating] = useState(false);

   const cardData = [
      {
         title: "Mis Pacientes",
         description: "Accede, organiza y administra el historial completo de todos tus pacientes de forma rápida y segura.",
         icon: <FaUsers />,
         secondaryIcon: <FaUserInjured />,
         path: "/patient-list",
         bg: "bg-pacientes",
      },
      {
         title: "Diagnosticar",
         description: "Utiliza tecnología de inteligencia artificial de vanguardia para realizar diagnósticos precisos y confiables.",
         icon: <FaStethoscope />,
         secondaryIcon: <FaStar />,
         path: "/Diagnosticar",
         bg: "bg-diagnostico",
      },
   ];

   // Modificar handleCardClick
   const handleCardClick = (index) => {
   if (selected === index || isTransitioning) return;
   
   const gameMode = cardData[index].bg.replace('bg-', '');
   const selectedCard = cardData[index];
   
   createScreenTransition(gameMode, selectedCard, () => {
      setSelected(index);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
   });
   };

   // Función para crear la transición
   const createScreenTransition = (gameMode, selectedCard, callback) => {
   setIsTransitioning(true);
   
   // Crear el overlay
   const overlay = document.createElement('div');
   overlay.className = 'screen-transition-overlay';
   
   // Elegir tipo de transición aleatoriamente
   const randomType = 'circle'; // Forzar la animación de círculo siempre
   
   let transitionElement;
   
   switch(randomType) {
      case 'slide':
         transitionElement = document.createElement('div');
         transitionElement.className = `screen-wipe ${gameMode}`;
         break;
      case 'circle':
         transitionElement = document.createElement('div');
         transitionElement.className = `circle-wipe ${gameMode}`;
         break;
      case 'curtain':
         transitionElement = document.createElement('div');
         transitionElement.className = `curtain-wipe ${gameMode}`;
         break;
   }
   
   // Crear el contenedor del icono
   const iconContainer = document.createElement('div');
   iconContainer.className = 'transition-icon';
   
   // AQUÍ SE PUEDE CAMBIAR EL ICONO SEGÚN LA OPCIÓN SELECCIONADA
   // Por ejemplo:
   if (selectedCard.title === 'Mis Pacientes') {
      iconContainer.innerHTML = `
         <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05C15.64 13.36 17 14.28 17 15.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
         </svg>
      `;
   } else if (selectedCard.title === 'Diagnosticar') {
      iconContainer.innerHTML = `
         <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
            <path d="M19.07 4.93a10 10 0 1 0 0 14.14 10 10 0 0 0 0-14.14zm-7.07 13a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-13h-2v2h2zm0 14h-2v2h2zm7-7h-2v2h2zm-14 0H3v2h2zm9.07-5.07l-1.41 1.41 1.41 1.41 1.41-1.41zm-8.49 8.49l-1.41 1.41 1.41 1.41 1.41-1.41zm8.49 1.41l1.41-1.41-1.41-1.41-1.41 1.41zm-8.49-8.49l1.41-1.41-1.41-1.41-1.41 1.41z"/>
         </svg>
      `;
   }
   // También puedes pasarle directamente el icono como parámetro
   
   transitionElement.appendChild(iconContainer);
   overlay.appendChild(transitionElement);
   document.body.appendChild(overlay);
   
   // Iniciar la animación de entrada
   requestAnimationFrame(() => {
      switch(randomType) {
         case 'slide':
         transitionElement.classList.add('slide-in');
         break;
         case 'circle':
         transitionElement.classList.add('expand');
         break;
         case 'curtain':
         transitionElement.classList.add('drop-down');
         break;
      }
      
      // Mostrar icono después de un pequeño delay
      setTimeout(() => {
         iconContainer.classList.add('show');
      }, 200);
   });
   
   // Ejecutar callback en el medio de la animación
   setTimeout(() => {
      callback();
   }, 300);
   
   // Ocultar icono antes de la salida
   setTimeout(() => {
      iconContainer.classList.add('hide');
   }, 350);
   
   // Animar salida
   setTimeout(() => {
      switch(randomType) {
         case 'slide':
         transitionElement.classList.remove('slide-in');
         transitionElement.classList.add('slide-out');
         break;
         case 'circle':
         transitionElement.style.opacity = '0';
         break;
         case 'curtain':
         transitionElement.classList.remove('drop-down');
         transitionElement.classList.add('lift-up');
         break;
      }
   }, 400);
   
   // Limpiar
   setTimeout(() => {
      document.body.removeChild(overlay);
      setIsTransitioning(false);
   }, 1000);
   };

   const handleConfirm = () => {
      if (selected !== null) navigate(cardData[selected].path);
   };

      useEffect(() => {
      changeBackground({ value: "light", label: "Light" });
   }, []);

   useEffect(() => {
   // Intersection Observer para detectar cuando una tarjeta está visible en móviles
   const handleIntersection = (entries) => {
      if (window.innerWidth <= 768) {
         entries.forEach(entry => {
         if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const cardIndex = parseInt(entry.target.dataset.cardIndex);
            if (selected !== cardIndex && !isTransitioning) {
               const gameMode = cardData[cardIndex].bg.replace('bg-', '');
               const selectedCard = cardData[cardIndex];
               
               createScreenTransition(gameMode, selectedCard, () => {
               setSelected(cardIndex);
               setIsAnimating(true);
               setTimeout(() => setIsAnimating(false), 300);
               });
            }
         }
         });
      }
   };

   const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
   });

   // Observar las tarjetas solo en móviles
   if (window.innerWidth <= 768) {
      const cards = document.querySelectorAll('.game-card');
      cards.forEach(card => observer.observe(card));
   }

   return () => observer.disconnect();
   }, [selected, isTransitioning, cardData]);

   return (
      <div className={`game-mode-wrapper ${selected !== null ? cardData[selected].bg : ""}`}>

         {/* Overlay para la transición circular */}
         <div className="circular-transition-overlay"></div>
         
         {/* Título principal mejorado */}
         <div className="main-title">
            <h1>Escoge la función que necesitas</h1>
         </div>

         <div className="game-mode-container">
            {cardData.map((card, index) => (
               <div
               key={index}
               data-card-index={index}  // Agregar esta línea
               className={`game-card ${
                  selected === index ? "selected" : selected === null ? `default-theme-${theme?.value || 'light'}` : ""
               } ${isAnimating ? "animating" : ""}`}
               onClick={(e) => handleCardClick(index, e)}
               >
                  {/* Badge de selección */}
                     <div className="selection-badge">
                        <FaDotCircle />
                     </div>

                  {/* Contenedor de iconos */}
                  <div className="icon-container">
                     <div className="icon primary-icon">{card.icon}</div>
                     <div className="icon secondary-icon">{card.secondaryIcon}</div>
                  </div>

                  <div className="card-tittle">
                     <h3>{card.title}</h3>
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="card-content">
                     <p className="description">{card.description}</p>
                  </div>

                  {/* Indicador de hover */}
                  <div className="hover-indicator">
                     <FaInfo  />
                  </div>

                  {/* Efecto de brillo */}
                  <div className="shine-effect"></div>
               </div>
            ))}
         </div>

         <button
            className={`confirm-button ${selected !== null ? "active" : ""}`}
            onClick={handleConfirm}
            disabled={selected === null}
         >
            {selected !== null && <FaChevronRight className="button-icon" />}
            <div className="button-shine"></div>
         </button>
      </div>
   );
};

export default Home;