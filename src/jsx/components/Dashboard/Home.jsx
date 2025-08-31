import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaCalendarAlt,
  FaBell,
  FaChartLine,
  FaHeartbeat,
  FaFileAlt,
  FaUserMd,
  FaStethoscope,
  FaEye,
  FaEllipsisV,
  FaCalendar
} from "react-icons/fa";

import "./dashboardCss/Dashboard.css";
import { useLocation, useNavigate } from "react-router-dom";
import { getDoctorById } from "../../../services/DocInfo/doctorService";
import { getMyPatients } from "../../../services/patients/patientService"; // Asegúrate de que esta importación sea correcta
import { useAuthUser } from "../../../services/CurrentAuth"; // Asegúrate de que esta importación sea correcta

const Dashboard = () => {
  const [stats, setStats] = useState({
    activePatients: 42,
    pendingResults: 7,
    notifications: 3,
  });

  const navigate = useNavigate();
  const notificationsRef = useRef(null);
  const location = useLocation();

  const scrollSmooth = (sectionRef) => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (location.state?.scrollTo) {
      switch (location.state?.scrollTo) {
        case "notifications":
          scrollSmooth(notificationsRef);
          break;
      }
    }
  }, [location]);

  const { organizacionId, uid } = useAuthUser();
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    if (!organizacionId || !uid) return;

    const fetchDoctor = async () => {
      try {
        const doc = await getDoctorById(organizacionId, uid);
        setDoctor(doc);
      } catch (e) {
        console.error("Error cargando doctor:", e);
      }
    };

    fetchDoctor();
  }, [organizacionId, uid]);

  // Inicializa recentPatients como un array vacío, se llenará con la llamada a la API
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // getMyPatients ya no necesita el UID como parámetro si lo obtiene del token
        const response = await getMyPatients();
        setRecentPatients(response.data); // Asumiendo que la respuesta de Axios tiene un campo .data
      } catch (e) {
        console.error("Error cargando pacientes:", e);
        setRecentPatients([]); // Asegurarse de que patients sea un array vacío en caso de error
      }
    };

    if (uid) { // Solo si el UID del usuario está disponible
      fetchPatients();
    }
  }, [uid]); // Dependencia solo del UID, ya que organizacionId no es necesario para getMyPatients

  const [recentResults, setRecentResults] = useState([
    {
      id: 1,
      type: "Análisis de Presión Plantar",
      patient: "Carlos Mendez",
      status: "Completado",
      time: "Hoy",
      icon: <FaHeartbeat />,
    },
    {
      id: 2,
      type: "Análisis Postural",
      patient: "María González",
      status: "En proceso",
      time: "Ayer",
      icon: <FaUser />,
    },
    {
      id: 3,
      type: "Radiografía",
      patient: "Laura Sánchez",
      status: "Pendiente",
      time: "Hace 2 días",
      icon: <FaFileAlt />,
    },
    {
      id: 4,
      type: "Electrocardiograma",
      patient: "Javier Ruiz",
      status: "Completado",
      time: "Hace 3 días",
      icon: <FaHeartbeat />,
    },
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "diagnosis",
      title: "Nuevo diagnóstico disponible",
      description: "Carlos Mendez - Análisis de presión plantar completado",
      time: "Hace 1 hora",
    },
    {
      id: 2,
      type: "appointment",
      title: "Recordatorio de cita",
      description: "María González - Mañana a las 10:00 AM",
      time: "Hace 5 horas",
    },
    {
      id: 3,
      type: "alert",
      title: "Alerta de resultados",
      description: "Laura Sánchez - Resultados anormales detectados",
      time: "Ayer",
    },
  ]);

  const [chartData, setChartData] = useState([
    { label: "Pacientes", value: 24, color: "#3b82f6" },
    { label: "Consultas", value: 36, color: "#10b981" },
    { label: "Estudios", value: 18, color: "#f59e0b" },
    { label: "Diagnósticos", value: 15, color: "#8b5cf6" },
  ]);

  useEffect(() => {
    // Animación de entrada para las tarjetas
    const cards = document.querySelectorAll(".stat-card, .content-card");
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }, []);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Bienvenido</h1>
          <p>Dr. {doctor?.nombre}. Aquí tiene un resumen de su actividad.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate("/Mis-Pacientes")}>
          <div className="stat-header">
            <div className="stat-icon">
              <FaUser />
            </div>
          </div>
          <div className="stat-number">{stats.activePatients}</div>
          <div className="stat-label">corregir cantidad de pacientes</div>
        </div>

        <div className="stat-card" onClick={() => navigate("/Mis-Pacientes")}>
          <div className="stat-header">
            <div className="stat-icon">
              <FaCalendar />
            </div>
          </div>
          <div className="stat-number">5</div>
          <div className="stat-label">Citas pendientes</div>
        </div>

        <div
          className="stat-card"
          onClick={() => scrollSmooth(notificationsRef)}
        >
          <div className="stat-header">
            <div className="stat-icon">
              <FaBell />
            </div>
          </div>
          <div className="stat-number">{stats.notifications}</div>
          <div className="stat-label">Notificaciones</div>
        </div>
      </div>

      {/* Content full */}
      <div className="content-full-grid">
        {/* Recent Patients */}
        <div className="content-card">
          <div className="card-header" onClick={() => navigate("/Mis-Pacientes")}>
            <h3>Pacientes Recientes</h3>
            <button className="view-all-btn">Ver todos</button>
          </div>
        <div className="card-body">
          {recentPatients.length === 0 ? (
            <p style={{ padding: "1rem", color: "#888" }}>
              No hay pacientes registrados aún.
            </p>
          ) : (
            recentPatients.map((patient, index) => {
              const initials = patient.name
                ? patient.name.split(" ").map((p) => p[0]).join("").toUpperCase()
                : "PT";

              // Mostrar creadoEn como fecha legible
              let timeText = "Sin fecha";
              if (patient.creadoEn?.toDate) {
                const fecha = patient.creadoEn.toDate();
                timeText = fecha.toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
              }

              return (
                <div
                  key={patient.id} // Usar patient.id como key
                  className="patient-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="patient-avatar">{initials}</div>
                  <div className="patient-info">
                    <h4 className="patient-name">{patient.name}</h4>
                    <p className="patient-condition">
                      {patient.pathology || "Sin información de patología"}
                    </p>
                  </div>
                  <div className="patient-time">{timeText}</div>
                  <button className="patient-action">
                    <FaEye />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      </div>

      {/* Notifications */}
      <div
        className="content-card"
        style={{ marginTop: "30px" }}
        ref={notificationsRef}
      >
        <div className="card-header">
          <h3>Notificaciones</h3>
        </div>
        <div className="card-body">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className="notification-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="notification-icon">
                {notification.type === "diagnosis" && <FaStethoscope />}
                {notification.type === "appointment" && <FaCalendarAlt />}
                {notification.type === "alert" && <FaBell />}
              </div>
              <div className="notification-content">
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-description">
                  {notification.description}
                </p>
                <div className="notification-time">{notification.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
