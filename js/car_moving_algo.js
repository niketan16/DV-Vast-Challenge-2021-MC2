const csv = require('csv-parser');
const fs = require('fs');

// Read GPS data from CSV file
const gpsData = [];
fs.createReadStream('gps.csv')
  .pipe(csv())
  .on('data', (row) => {
    gpsData.push(row);
  })
  .on('end', () => {
    // Extract unique IDs
    const uniqueIds = [...new Set(gpsData.map((row) => row.id))];

    // Loop over each unique ID
    for (const id of uniqueIds) {
      // Sort rows for this ID by timestamp
      const rowsForId = gpsData.filter((row) => row.id === id);
      rowsForId.sort((a, b) => a.Timestamp.localeCompare(b.Timestamp));

      // Loop over each consecutive pair of rows
      for (let i = 1; i < rowsForId.length; i++) {
        const prevRow = rowsForId[i - 1];
        const currRow = rowsForId[i];

        // Calculate time difference in seconds
        const timeDiffSeconds = (new Date(currRow.Timestamp) - new Date(prevRow.Timestamp)) / 1000;

        // Calculate distance traveled in km
        const distanceKm = calculateDistance(prevRow.latitude, prevRow.longitude, currRow.latitude, currRow.longitude);

        // Calculate speed in km/h
        const speedKmph = distanceKm / (timeDiffSeconds / 3600);

        // Check if car is moving
        if (timeDiffSeconds < 30 && speedKmph > 20) {
          console.log("Car with ID ${id} is moving");
          break;
        }
		else if (distanceKm < 0.220) {
		 console.log("Car with ID ${id} is stationary");
		}
		else {
		 console.log("Car with ID ${id} is missing");
		}
      }
    }
  });

// Function to calculate distance between two GPS coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

// Function to convert degrees to radians
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
