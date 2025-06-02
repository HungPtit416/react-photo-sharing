/**
 * fetchModel - Fetch a model from the web server with JWT authentication.
 *
 * @param {string} url The URL path for the API endpoint.
 * @returns {Promise} A promise that resolves with the model data.
 */
function fetchModel(url) {
  const baseUrl =
    "https://bcd210b6-338b-4b20-964a-2be4c85f4ce2-00-3k548uxwx7434.sisko.replit.dev/api";
  const fullUrl = `${baseUrl}${url}`;

  // Get JWT token from localStorage
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(fullUrl, {
    credentials: "include", // Still needed for CORS
    headers: headers,
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - remove invalid token and redirect to login
          localStorage.removeItem("authToken");
          window.location.reload(); // This will trigger the login check in App.js
          throw new Error("Unauthorized");
        }
        throw new Error(`HTTP error status: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching model:", error);
      throw error;
    });
}

export default fetchModel;
