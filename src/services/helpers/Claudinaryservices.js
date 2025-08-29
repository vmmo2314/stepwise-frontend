import axiosInstance from '../AxiosInstance'; // Usa la instancia de Axios configurada

class CloudinaryService {
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append("image", file); // 'image' debe coincidir con el nombre del campo en tu backend (upload.single('image'))

      const response = await axiosInstance.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Importante para la subida de archivos
        },
      });

      return response.data; // Contiene url, publicId, etc.
    } catch (error) {
      console.error("💥 Error al subir imagen a través del backend:", error);
      throw new Error(`Error al subir imagen: ${error.response?.data?.error || error.message}`);
    }
  }
}

export default new CloudinaryService();