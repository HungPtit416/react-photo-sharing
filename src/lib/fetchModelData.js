/**
 * fetchModel - Fetch a model from the web server.
 *
 * @param {string} url The URL path for the API endpoint.
 * @returns {Promise} A promise that resolves with the model data.
 */
function fetchModel(url) {
  const baseUrl = "http://localhost:8081/api";
  const fullUrl = `${baseUrl}${url}`;

  return fetch(fullUrl, {
    credentials: "include", // Include session cookies
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
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
