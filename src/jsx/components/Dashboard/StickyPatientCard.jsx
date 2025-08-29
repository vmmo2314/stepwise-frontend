import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../../../context/ThemeContext';

const StickyPatientInfo = ({ patient, profilePic }) => {
  const [isFloating, setIsFloating] = useState(false);
  const [wasFloating, setWasFloating] = useState(false);
  const [showStatic, setShowStatic] = useState(true);
  const elementRef = useRef(null);
  const originalPositionRef = useRef(null);

  const { background } = useContext(ThemeContext);
  const isDarkTheme = background.value === 'dark';

  useEffect(() => {
    if (elementRef.current && !originalPositionRef.current) {
      originalPositionRef.current = elementRef.current.getBoundingClientRect().top + window.scrollY;
    }

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const shouldFloat = scrollTop > originalPositionRef.current + 100;

      if (shouldFloat) {
        setShowStatic(false);
        setIsFloating(true);
        setWasFloating(true);
      } else if (wasFloating) {
        setIsFloating(false);
        setTimeout(() => {
          setWasFloating(false);
          setShowStatic(true);
        }, 400); // Delay para que la salida flotante termine
      } else {
        setShowStatic(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [wasFloating]);

  if (!patient) return null;

  // ----------------------
  // Estilos
  // ----------------------

  const transition = 'opacity 0.4s ease, transform 0.4s ease';

  const floatingBaseStyles = {
    position: 'fixed',
    bottom: '20px',
    left: 'calc(50% + 100px)',
    transform: 'translateX(-50%)',
    zIndex: 1050,
    transition,
    maxWidth: '90vw',
    minWidth: '250px',
  };

  const animatedStyles = {
    transform: 'translateX(-50%) translateY(0) scale(1)',
    opacity: 1,
  };

  const hiddenStyles = {
    transform: 'translateX(-50%) translateY(20px) scale(0.95)',
    opacity: 0,
  };

  const staticBaseStyles = {
    position: 'relative',
    zIndex: 1000,
    transition,
    maxWidth: '100%',
    width: '100%',
    transform: 'translateY(0)',
  };

  const staticVisible = {
    opacity: 1,
    transform: 'translateY(0)',
  };

  const staticHidden = {
    opacity: 0,
    transform: 'translateY(-10px)',
  };

  const themeBackgroundStyle = {
    backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: '16px',
    boxShadow: isFloating
      ? `0 8px 32px ${isDarkTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'}, 0 0 0 1px ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
      : 'none',
    padding: '16px 20px',
    margin: isFloating ? '0' : '8px 16px',
  };

  // ----------------------
  // Estilo final según estado
  // ----------------------
  let finalStyle;

  if (wasFloating) {
    finalStyle = {
      ...floatingBaseStyles,
      ...(isFloating ? animatedStyles : hiddenStyles),
    };
  } else {
    finalStyle = {
      ...staticBaseStyles,
      ...(showStatic ? staticVisible : staticHidden),
    };
  }

  return (
    <div
      ref={elementRef}
      className="sticky-patient-info"
      style={{
        ...finalStyle,
        ...themeBackgroundStyle,
      }}
    >
      <div className="d-flex align-items-center">
        <div className="me-3">
          <img
            src={profilePic}
            alt="Foto del paciente"
            className="rounded-circle"
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'cover',
              border: '3px solid #ffffff',
              boxShadow: `0 4px 12px ${isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)'}`,
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          />
        </div>
        <div>
          <h6 className={`mb-0 fw-bold ${isDarkTheme ? 'text-white' : 'text-dark'}`}>{patient.name}</h6>
          <p className={`mb-0 small ${isDarkTheme ? 'text-light' : 'text-muted'}`}>Paciente en análisis</p>
        </div>
      </div>
    </div>
  );
};

export default StickyPatientInfo;
