import { translations } from './translations.js';

// Variable global para los textos actuales
let currentTexts = {};

function applyLanguage() {
  const lang = navigator.language.split('-')[0];

  const userLang = translations[lang] ? lang : 'en';
  currentTexts = translations[userLang];

  // Traducir textos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (currentTexts[key]) el.innerText = currentTexts[key];
  });

  // Traducir placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (currentTexts[key]) el.placeholder = currentTexts[key];
  });
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', applyLanguage);

// Coordenadas por defecto en el Mali (Lima)
const defaultLocation = [-12.0594345, -77.0380233];
const defaultZoom = 16;

// Crear la instancia del mapa sin setView inicial
const map = L.map('map');

// Añadir la capa de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Intentar localizar al usuario
map.locate({ setView: true, maxZoom: 16 });

// Si se encuentra la ubicación con éxito
map.on('locationfound', function(e) {
  // Opcional: Colocar un marcador donde está el usuario
  if (currentMarker) map.removeLayer(currentMarker);
  currentMarker = L.marker(e.latlng).addTo(map);
  
  // Actualizar el código postal automáticamente
  updateZipCode(e.latlng.lat, e.latlng.lng);
});

// Si falla la localización (permiso denegado o error)
map.on('locationerror', function() {
  console.log("No se pudo obtener la ubicación, usando Lima por defecto.");
  map.setView(defaultLocation, defaultZoom);
});

// Referencias a elementos del DOM
const zipResultDisplay = document.getElementById('zip-code-result');
const copyBtn = document.getElementById('copy-btn');
const copyText = document.getElementById('copy-text');

let currentMarker;

// Función para obtener datos y actualizar la interfaz
async function updateZipCode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  
  // Feedback visual mientras busca
  zipResultDisplay.innerText = "...";
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Extraer código postal
    const zip = data.address.postcode || "N/A";
    
    // Se actualiza el bloque de texto
    zipResultDisplay.innerText = zip;
    
  } catch (error) {
    console.error("Error:", error);
    zipResultDisplay.innerText = "Error";
  }
}

// Evento: Clic en el mapa
map.on('click', function(e) {
  // Manejo del marcador
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }
  currentMarker = L.marker(e.latlng).addTo(map);
  
  // Ejecutar la actualización del código postal
  updateZipCode(e.latlng.lat, e.latlng.lng);
});

// Lógica del botón Copiar
copyBtn.addEventListener('click', () => {
  const zipToCopy = zipResultDisplay.innerText;
  
  if (zipToCopy !== "-----" && zipToCopy !== "..." && zipToCopy !== "N/A") {
    navigator.clipboard.writeText(zipToCopy).then(() => {
      // Feedback visual de copiado
      const originalText = copyText.innerText;
      copyText.innerText = "✅";
      setTimeout(() => {
        copyText.innerText = originalText;
      }, 2000);
    });
  }
});

const addressInput = document.getElementById('address-input');
const getZipBtn = document.getElementById('get-zip-btn');

// Función para buscar por dirección de texto
async function searchByAddress() {
  const address = addressInput.value.trim();
  
  if (address.length < 3) {
    alert("Por favor, ingresa una dirección más específica.");
    return;
  }

  // Feedback visual inicial
  zipResultDisplay.innerText = "...";
  
  // Servicio de búsqueda de Nominatim
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

  try {
    const response = await fetch(url);
    const results = await response.json();

    if (results.length > 0) {
      const location = results[0];
      const lat = parseFloat(location.lat);
      const lon = parseFloat(location.lon);

      // Centrar el mapa en el resultado
      map.setView([lat, lon], 16);

      // Actualizar el marcador
      if (currentMarker) {
        map.removeLayer(currentMarker);
      }
      currentMarker = L.marker([lat, lon]).addTo(map);

      // Obtener el código postal (reutilizamos tu función anterior)
      updateZipCode(lat, lon);
      
    } else {
      zipResultDisplay.innerText = "N/A";
      alert("No se encontró la ubicación. Intenta ser más específico (ej: Calle, Ciudad).");
    }
  } catch (error) {
    console.error("Error en la búsqueda:", error);
    zipResultDisplay.innerText = "Error";
  }
}

// Evento para el botón "obtener"
getZipBtn.addEventListener('click', searchByAddress);

// Permitir que funcione al presionar "Enter" en el input
addressInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchByAddress();
  }
});