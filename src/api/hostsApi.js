const API_BASE_URL = "http://localhost:8000/api/v1";

export const fetchHostsData = async (ifid = 4) => {
  const response = await fetch(`${API_BASE_URL}/lan-hosts?ifid=${ifid}`);
  if (!response.ok) {
    throw new Error("Error al conectar con el Backend de Python");
  }
  return await response.json();
};

// US-002: Consulta base del host seleccionado
export const fetchHostDetail = async (ip) => {
  const response = await fetch(`${API_BASE_URL}/hosts/${ip}`);
  if (!response.ok) throw new Error(`No se pudo obtener el detalle del host ${ip}`);
  return await response.json();
};

// US-003: Consulta de distribución de aplicaciones L7 (¡CORREGIDO!)
export const fetchHostApplications = async (ip, ifid = 4, limit = 6) => {
  // Cambiado: /traffic/${ip}/top-applications  ==>  /hosts/${ip}/top-applications
  const response = await fetch(`${API_BASE_URL}/hosts/${ip}/top-applications?ifid=${ifid}&limit=${limit}`);
  if (!response.ok) throw new Error(`No se pudieron obtener las aplicaciones del host ${ip}`);
  return await response.json();
  };