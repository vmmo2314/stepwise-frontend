import axiosInstance from "./axiosInstance"

const ProfileService = {
  // Obtener perfil del usuario actual
  async getProfile() {
    try {
      console.log("🔍 Obteniendo perfil del usuario...")
      const response = await axiosInstance.get("/api/profile")
      console.log("✅ Perfil obtenido:", response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error obteniendo perfil:", error)
      throw error
    }
  },

  // Actualizar perfil del usuario actual
  async updateProfile(profileData) {
    try {
      console.log("📝 Actualizando perfil:", profileData)
      const response = await axiosInstance.put("/api/profile", profileData)
      console.log("✅ Perfil actualizado:", response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error actualizando perfil:", error)
      throw error
    }
  },
}

export default ProfileService
