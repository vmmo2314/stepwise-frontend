import axiosInstance from "../AxiosInstance"

// Crea propuesta (paciente → doctor)
export const createAppointment = async (payload) => {
  try {
    const { data } = await axiosInstance.post("/api/appointments", payload)
    return data
  } catch (error) {
    console.error("AppointmentService.createAppointment:", error)
    throw error.response?.data?.error || error.message
  }
}

// Lista citas del doctor (para pintar el calendario del paciente según doctor)
export const getDoctorAppointments = async (clinicaId, doctorId, status = "all") => {
  try {
    // Si no se pasa doctorId, usa el endpoint del doctor autenticado
    const url = doctorId
      ? `/api/appointments/doctor/${doctorId}`
      : `/api/appointments/doctor/me`

    const { data } = await axiosInstance.get(url, {
      params: { clinicaId, status },
    })
    return data
  } catch (error) {
    console.error("AppointmentService.getDoctorAppointments:", error)
    throw error.response?.data?.error || error.message
  }
}

// 🔹 NUEVO: lista citas del propio doctor autenticado
export const getMyAppointments = async (clinicaId, status = "all") => {
  try {
    const { data } = await axiosInstance.get("/api/appointments/doctor/me", {
      params: { clinicaId, status },
    });
    return data;
  } catch (error) {
    console.error("AppointmentService.getMyAppointments:", error);
    throw error.response?.data?.error || error.message;
  }
};

export const acceptAppointment = async ({
  appointmentId,
  doctorNotes = "",
  doctorId,         // ⬅️ nuevo
  doctorName,       // ⬅️ nuevo (requerido por el backend)
}) => {
  try {
    const { data } = await axiosInstance.patch(
      `/api/appointments/${appointmentId}/accept`,
      {
        doctorNotes,
        doctorId: doctorId ?? null,     // si tu backend no lo pide, lo ignora
        doctorName,                     // ⬅️ obligatorio para evitar el 400
      }
    );
    return data;
  } catch (error) {
    console.error("AppointmentService.acceptAppointment:", error);
    throw error.response?.data?.error || error.message;
  }
};

export const rejectAppointment = async ({ appointmentId, doctorNotes = "" }) => {
  try {
    const { data } = await axiosInstance.patch(`/api/appointments/${appointmentId}/reject`, {
      doctorNotes
    });
    return data;
  } catch (error) {
    console.error("AppointmentService.rejectAppointment:", error);
    throw error.response?.data?.error || error.message;
  }
};

export const rescheduleAppointment = async ({ appointmentId, alternativeDate, alternativeTime, doctorNotes = "" }) => {
  try {
    const { data } = await axiosInstance.patch(`/api/appointments/${appointmentId}/reschedule`, {
      alternativeDate,
      alternativeTime,
      doctorNotes
    });
    return data;
  } catch (error) {
    console.error("AppointmentService.rescheduleAppointment:", error);
    throw error.response?.data?.error || error.message;
  }
};

export const getPatientAppointments = async (status = "all") => {
  try {
    const config = {};
    if (status && status !== "all") {
      config.params = { status };
    }
    const { data } = await axiosInstance.get("/api/appointments/patient/me", config);
    return data;
  } catch (error) {
    console.error("AppointmentService.getPatientAppointments:", error);
    throw error.response?.data?.error || error.message;
  }
};