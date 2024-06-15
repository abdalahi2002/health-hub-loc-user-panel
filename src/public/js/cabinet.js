var map;
var markers = [];
var polylines = [];
var directionsService;
var directionsRenderer;
var cabinets = [];
var currentPage = 1;
var cabinetsPerPage = 5;

async function fetchCabinets() {
  try {
    const response = await fetch("http://localhost:8080/api/health/cabinets");
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    cabinets = await response.json();
    console.log("Cabinets fetched from API:", cabinets);
    return cabinets;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

async function initMap() {
  var location = { lat: 18.089568255185064, lng: -15.984527865438487 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: location,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);

  const cabinets = await fetchCabinets();
  if (cabinets) {
    displayCabinets(cabinets);
    drawWillayaLines(cabinets);
  }

  document
    .getElementById("willayaSelect")
    .addEventListener("change", filterCabinets);
  document
    .getElementById("moughataaSelect")
    .addEventListener("change", filterCabinets);
  document
    .getElementById("prevBtn")
    .addEventListener("click", showPreviousPage);
  document.getElementById("nextBtn").addEventListener("click", showNextPage);
}

function drawWillayaLines(cabinets) {
  clearPolylines();
  const willayaGroups = cabinets.reduce((acc, cabinet) => {
    if (!acc[cabinet.willaya]) {
      acc[cabinet.willaya] = [];
    }
    acc[cabinet.willaya].push(cabinet);
    return acc;
  }, {});

  const colors = {
    "Nouakchott-Nord": "#FF0000",
    "Nouakchott-Ouest": "#00FF00",
    "Nouakchott-Sud": "#0000FF",
  };

  Object.keys(willayaGroups).forEach((willaya) => {
    const lineCoordinates = willayaGroups[willaya].map((cabinet) => ({
      lat: cabinet.latitude,
      lng: cabinet.longitude,
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

function clearPolylines() {
  polylines.forEach((polyline) => polyline.setMap(null));
  polylines = [];
}

function displayCabinets(cabinets) {
  console.log("Displaying cabinets:", cabinets);

  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  clearPolylines(); // Clear the polylines before drawing new ones

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const cabinetDistances = cabinets.map((cabinet) => {
          const distance = getDistanceFromLatLonInKm(
            userLat,
            userLng,
            cabinet.latitude,
            cabinet.longitude
          );
          return { ...cabinet, distance };
        });

        cabinetDistances.sort((a, b) => a.distance - b.distance);

        const cabinetList = document.getElementById("cabinetList");
        cabinetList.innerHTML = "";

        const paginatedCabinets = paginate(
          cabinetDistances,
          currentPage,
          cabinetsPerPage
        );

        paginatedCabinets.forEach((cabinet, index) => {
          const li = document.createElement("li");
          li.classList.add("py-5", "flex", "items-start", "justify-between");
          li.innerHTML = `
          <div class="flex gap-3">
            <img src="../public/assets/Logos/cabi.jpg" class="flex-none w-16 h-16" />
            <div>
              <span class="block text-sm text-gray-700 font-semibold">${
                cabinet.nom
              }</span>
              <span class="block text-sm text-gray-600">${cabinet.distance.toFixed(
                2
              )} km</span>
              <span class="block text-sm text-gray-600"> ${cabinet.willaya}-${
            cabinet.moughataa
          }</span>
            </div>
          </div>
          <a
             href="https://www.google.com/maps/dir/?api=1&destination=${
               cabinet.latitude
             },${cabinet.longitude}"
             target="_blank"
            class="text-gray-700 text-sm border border-[#47C3A4] rounded-lg px-3 py-2 duration-150 bg-white hover:bg-[#47C3A4] flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.447-.894L15 4"
              />
            </svg>
            View in map
          </a>`;
          cabinetList.appendChild(li);

          const marker = new google.maps.Marker({
            position: { lat: cabinet.latitude, lng: cabinet.longitude },
            map: map,
            title: cabinet.nom,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
            <div>
              <h2>${cabinet.nom}</h2>
              <p>Willaya: ${cabinet.willaya}</p>
              <p>Moughataa: ${cabinet.moughataa}</p>
             <a href="https://www.google.com/maps/dir/?api=1&destination=${cabinet.latitude},${cabinet.longitude}" target="_blank">View in Maps</a>
            </div>
          `,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          markers.push(marker);
        });

        updatePaginationButtons(cabinetDistances.length);
        drawWillayaLines(paginatedCabinets);
      },
      (error) => {
        console.error("Error getting user location:", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

function paginate(items, currentPage, itemsPerPage) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return items.slice(startIndex, startIndex + itemsPerPage);
}

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

function showPreviousPage() {
  if (currentPage > 1) {
    currentPage--;
    filterCabinets();
  }
}

function showNextPage() {
  currentPage++;
  filterCabinets();
}

function filterCabinets() {
  const willaya = document.getElementById("willayaSelect").value;
  const moughataa = document.getElementById("moughataaSelect").value;

  const filteredCabinets = cabinets.filter((cabinet) => {
    return (
      (willaya === "" || cabinet.willaya === willaya) &&
      (moughataa === "" || cabinet.moughataa === moughataa)
    );
  });

  displayCabinets(filteredCabinets);
}

function getDirections(lat, lng) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const request = {
          origin: { lat: userLat, lng: userLng },
          destination: { lat: lat, lng: lng },
          travelMode: google.maps.TravelMode.DRIVING,
        };
        directionsService.route(request, (result, status) => {
          if (status == google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            map.setZoom(15);
          } else {
            console.error("Directions request failed due to " + status);
          }
        });
      },
      (error) => {
        console.error("Error getting user location:", error);
      }
    );
  }
}
