var map;
var markers = [];
var polylines = [];
var directionsService;
var directionsRenderer;
var pharmacies = [];
var currentPage = 1;
var pharmaciesPerPage = 5;

// Fonction asynchrone pour récupérer les pharmacies depuis l'API
async function fetchPharmacies() {
  try {
    const response = await fetch("http://localhost:8080/api/health/pharmacies");
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    pharmacies = await response.json();
    console.log("Pharmacies fetched from API:", pharmacies);
    return pharmacies;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

// Initialisation de la carte Google Maps et des événements
async function initMap() {
  var location = { lat: 18.089568255185064, lng: -15.984527865438487 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: location,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);

  const pharmacies = await fetchPharmacies();
  if (pharmacies) {
    displayPharmacies(pharmacies);
    drawWillayaLines(pharmacies);
  }

  document
    .getElementById("willayaSelect")
    .addEventListener("change", filterPharmacies);
  document
    .getElementById("moughataaSelect")
    .addEventListener("change", filterPharmacies);
  document
    .getElementById("prevBtn")
    .addEventListener("click", showPreviousPage);
  document.getElementById("nextBtn").addEventListener("click", showNextPage);
}

// Fonction pour dessiner les lignes de wilayas sur la carte
function drawWillayaLines(pharmacies) {
  clearPolylines();
  const willayaGroups = pharmacies.reduce((acc, pharmacy) => {
    if (!acc[pharmacy.willaya]) {
      acc[pharmacy.willaya] = [];
    }
    acc[pharmacy.willaya].push(pharmacy);
    return acc;
  }, {});

  const colors = {
    "Nouakchott-Nord": "#FF0000",
    "Nouakchott-Ouest": "#00FF00",
    "Nouakchott-Sud": "#0000FF",
  };

  Object.keys(willayaGroups).forEach((willaya) => {
    const lineCoordinates = willayaGroups[willaya].map((pharmacy) => ({
      lat: pharmacy.latitude,
      lng: pharmacy.longitude,
    }));
    const polyline = new google.maps.Polyline({
      path: lineCoordinates,
      geodesic: true,
      strokeColor: colors[willaya],
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    polyline.setMap(map);
    polylines.push(polyline);
  });
}

// Fonction pour effacer les lignes de wilayas de la carte
function clearPolylines() {
  polylines.forEach((polyline) => polyline.setMap(null));
  polylines = [];
}

// Fonction pour afficher les pharmacies sur la carte et dans la liste
function displayPharmacies(pharmacies) {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const pharmacyDistances = pharmacies.map((pharmacy) => {
          const distance = getDistanceFromLatLonInKm(
            userLat,
            userLng,
            pharmacy.latitude,
            pharmacy.longitude
          );
          return { ...pharmacy, distance };
        });

        pharmacyDistances.sort((a, b) => a.distance - b.distance);

        const pharmacyList = document.getElementById("pharmacyList");
        pharmacyList.innerHTML = "";

        const paginatedPharmacies = paginate(
          pharmacyDistances,
          currentPage,
          pharmaciesPerPage
        );

        paginatedPharmacies.forEach((pharmacy, index) => {
          const li = document.createElement("li");
          li.classList.add("py-5", "flex", "items-start", "justify-between");
          li.innerHTML = `
          <div class="flex gap-3">
            <img src="../public/assets/Logos/pha.jpg" class="flex-none w-16 h-16" />
            <div>
              <span class="block text-sm text-gray-700 font-semibold">${
                pharmacy.name
              }</span>
              <span class="block text-sm text-gray-600">${pharmacy.distance.toFixed(
                2
              )} km</span>
              <span class="block text-sm text-gray-600">${pharmacy.willaya}-${
            pharmacy.moughataa
          }</span>
            </div>
          </div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${
            pharmacy.latitude
          },${pharmacy.longitude}" target="_blank"
            class="text-gray-700 text-sm border border-[#47C3A4] rounded-lg px-3 py-2 duration-150 bg-white hover:bg-[#47C3A4] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.447-.894L15 4"/>
            </svg>
            View in map
          </a>`;
          pharmacyList.appendChild(li);

          const marker = new google.maps.Marker({
            position: { lat: pharmacy.latitude, lng: pharmacy.longitude },
            map: map,
            title: pharmacy.name,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
            <div>
              <h2>${pharmacy.name}</h2>
              <p>Willaya: ${pharmacy.willaya}</p>
              <p>Moughataa: ${pharmacy.moughataa}</p>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}" target="_blank">View in Maps</a>
            </div>
          `,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          markers.push(marker);
        });

        updatePaginationButtons(pharmacyDistances.length);
        drawWillayaLines(paginatedPharmacies);
      },
      (error) => {
        console.error("Error getting user location:", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

// Fonction pour paginer les pharmacies
function paginate(items, currentPage, itemsPerPage) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return items.slice(startIndex, startIndex + itemsPerPage);
}

// Fonction pour mettre à jour l'affichage des boutons de pagination
function updatePaginationButtons(totalItems) {
  const totalPages = Math.ceil(totalItems / pharmaciesPerPage);
  const pageCounter = document.getElementById("pageCounter");
  pageCounter.textContent = `Displaying ${Math.min(
    (currentPage - 1) * pharmaciesPerPage + 1,
    totalItems
  )} to ${Math.min(
    currentPage * pharmaciesPerPage,
    totalItems
  )} of ${totalItems} Entries`;

  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage === totalPages;
}

// Fonction pour afficher la page précédente
function showPreviousPage() {
  if (currentPage > 1) {
    currentPage--;
    filterPharmacies();
  }
}

// Fonction pour afficher la page suivante
function showNextPage() {
  currentPage++;
  filterPharmacies();
}

// Fonction de filtrage des pharmacies en fonction des sélecteurs
function filterPharmacies() {
  const willaya = document.getElementById("willayaSelect").value;
  const moughataa = document.getElementById("moughataaSelect").value;

  const filteredPharmacies = pharmacies.filter((pharmacy) => {
    return (
      (willaya === "" || pharmacy.willaya === willaya) &&
      (moughataa === "" || pharmacy.moughataa === moughataa)
    );
  });

  displayPharmacies(filteredPharmacies);
}

// Fonction pour calculer la distance en kilomètres entre deux points géographiques
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la terre en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance en km
  return d;
}

// Fonction utilitaire pour convertir des degrés en radians
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
