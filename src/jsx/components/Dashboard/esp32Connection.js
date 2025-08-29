// esp32Connection.js

// Variables globales para manejar la conexión
export let serialPort;
export let reader;
export let bluetoothDevice;
let isConnecting = false; // Variable para evitar conexiones simultáneas

// Función para conectar por USB
export async function connectUSB(processESPData) {
  // Evitar múltiples intentos de conexión simultáneos
  if (isConnecting) {
    console.log("Ya hay un intento de conexión en proceso");
    return;
  }

  isConnecting = true;

  try {
    // Limpiar conexión previa
    if (reader) {
      try {
        await reader.cancel();
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
      } catch (error) {
        console.log("Error al cancelar reader:", error);
      }
      reader = null;
    }

    if (serialPort) {
      try {
        await serialPort.close();
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
      } catch (error) {
        console.log("Error al cerrar puerto:", error);
      }
      serialPort = null;
    }

    // Nueva conexión
    serialPort = await navigator.serial.requestPort();
    
    if (!serialPort) {
      throw new Error("No se seleccionó ningún puerto");
    }

    await serialPort.open({ baudRate: 115200 });
    
    // Verificar que el puerto se abrió correctamente
    if (!serialPort.readable) {
      throw new Error("Error al abrir el puerto serial");
    }

    const decoder = new TextDecoderStream();
    reader = serialPort.readable.pipeThrough(decoder).getReader();

    // Solo mostrar alerta si todo el proceso fue exitoso
    alert("ESP32 conectado por USB");
    console.log("Conexión USB establecida exitosamente");
    
    // Iniciar lectura de datos
    listenToSerial(processESPData);

  } catch (error) {
    console.error("Error al conectar ESP32 por USB:", error);
    alert("Error de conexión: " + error.message);
    
    // Limpiar recursos en caso de error
    if (reader) {
      try {
        await reader.cancel();
      } catch (e) {
        console.log("Error al limpiar reader:", e);
      }
      reader = null;
    }
    
    if (serialPort) {
      try {
        await serialPort.close();
      } catch (e) {
        console.log("Error al limpiar puerto:", e);
      }
      serialPort = null;
    }
  } finally {
    isConnecting = false; // Permitir nuevos intentos de conexión
  }
}

// Escuchar datos del ESP32 por USB
async function listenToSerial(processESPData) {
  try {
    while (true && reader) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("Conexión USB cerrada normalmente");
        break;
      }
      if (value) {
        processESPData(value.trim());
      }
    }
  } catch (error) {
    console.error("Error en la lectura serial:", error);
  } finally {
    console.log("Finalizando lectura serial");
    if (reader) {
      try {
        await reader.cancel();
      } catch (error) {
        console.log("Error al cerrar reader en finally:", error);
      }
      reader = null;
    }
  }
}

// Función para conectar por Bluetooth
export async function connectBluetooth() {
  if (isConnecting) {
    console.log("Ya hay un intento de conexión en proceso");
    return;
  }

  isConnecting = true;

  try {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
      await bluetoothDevice.gatt.disconnect();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    bluetoothDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ["battery_service"],
    });
    
    const server = await bluetoothDevice.gatt.connect();
    alert("ESP32 conectado por Bluetooth");
    return server;
  } catch (error) {
    console.error("Error al conectar ESP32 por Bluetooth:", error);
    alert("Error de conexión Bluetooth: " + error.message);
    return null;
  } finally {
    isConnecting = false;
  }
}