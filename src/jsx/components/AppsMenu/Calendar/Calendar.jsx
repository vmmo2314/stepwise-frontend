import React from "react";
import PageTitle from "../../../layouts/PageTitle";
import EventCalendar from "./EventCalendar";
import PendingAppointments from "./PendingAppointments";

const Calendar = () => {
  return (
    <div className="min-h-[80vh] space-y-6">
      <PageTitle activeMenu="Calendar" motherMenu="App" />

      {/* Bloque de historial / citas pendientes del paciente logeado */}
      <PendingAppointments />

      {/* Tu calendar original puede quedarse para vista mensual, etc. */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <EventCalendar />
      </div>
    </div>
  );
};

export default Calendar;