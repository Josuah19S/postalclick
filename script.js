// Inicializar mapa
const map = L.map('map').setView([-12.0594345, -77.0380233], 16.46); // Coordenadas del MALI

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Obtener datos de la ubicación
async function getZipCode(lat, lng, marker) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  
  try {
    marker.bindPopup("Buscando código postal...").openPopup();
    const response = await fetch(url);
    const data = await response.json();
    
    // Obtener código postal
    const zip = data.address.postcode || "No encontrado";
    marker.setPopupContent("<b>Código Postal:</b><br>" + zip);
  } catch (error) {
    console.error("Error obteniendo el código:", error);
    marker.setPopupContent("Error al obtener datos.");
  }
}

// Click en el mapa
let currentMarker;

map.on('click', function(e) {
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }
  currentMarker = L.marker(e.latlng).addTo(map);
  getZipCode(e.latlng.lat, e.latlng.lng, currentMarker);
});