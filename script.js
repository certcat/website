document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('certcat-form');
  const container = document.querySelector('.container');
  const searchBox = document.querySelector('.search-box');
  const header = document.querySelector('h1');
  const comingSoonMessage = document.getElementById('coming-soon-message');
  const searchResults = document.getElementById('search-results');

  // Create loading spinner element
  const loadingSpinner = document.createElement('div');
  loadingSpinner.className = 'loading-spinner';
  loadingSpinner.style.display = 'none';
  container.appendChild(loadingSpinner);

  // Mock search function that returns certificate data
  function mockSearch(query) {
    // This would normally be a fetch call to an API
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Generate 20 mock results
        const results = [];
        const issuers = [
          "C=US, O=Let's Encrypt, CN=R3",
          "C=US, O=DigiCert Inc, CN=DigiCert TLS RSA SHA256 2020 CA1",
          "C=US, O=Amazon, CN=Amazon RSA 2048 M01",
          "C=GB, O=Sectigo Limited, CN=Sectigo RSA Domain Validation Secure Server CA",
          "C=US, O=Google Trust Services LLC, CN=GTS CA 1C3"
        ];

        const subdomains = [
            "www", "git", "www", "", "",
            "www", "git", "www", "", "",
            "www", "git", "www", "", "",
            "www", "git", "www", "", "mail",
        ];

        // Current date for reference
        const now = new Date();

        for (let i = 0; i < subdomains.length; i++) {
          // Generate random dates
          const notBeforeDate = new Date(now);
          notBeforeDate.setDate(notBeforeDate.getDate() - Math.floor(Math.random() * 180)); // Up to 6 months ago

          const notAfterDate = new Date(notBeforeDate);
          notAfterDate.setDate(notAfterDate.getDate() + Math.floor(Math.random() * 365) + 90); // 3-12 months validity

          // Fake domain:
            hostname = query;
            if (subdomains[i] !== "") {
                hostname = subdomains[i] + "." + query;
            }
          // Create result object
          results.push({
            hostname: hostname,
            notBefore: notBeforeDate.toISOString().split('.')[0]+"Z",
            notAfter: notAfterDate.toISOString().split('.')[0]+"Z",
            issuer: issuers[Math.floor(Math.random() * issuers.length)]
          });
        }

        resolve(results);
      }, 200);
    });
  }

  // Function to display search results
  function displaySearchResults(results) {
    // Clear previous results
    searchResults.innerHTML = '';

    // Create and append result elements
    results.forEach((result, index) => {
      const resultElement = document.createElement('div');
      resultElement.className = 'search-result';

      // Add staggered animation delay
      resultElement.style.animation = `fadeIn 0.5s ease-in-out ${index * 0.05}s both`;

      // Create hostname header
      const hostname = document.createElement('h3');
      hostname.textContent = result.hostname;
      resultElement.appendChild(hostname);

      // Create details container
      const details = document.createElement('div');
      details.className = 'search-result-details';

      // Add validity period
      const validFrom = document.createElement('div');
      validFrom.className = 'search-result-detail';
      validFrom.innerHTML = '<span class="search-result-label">Valid From:</span> ' + result.notBefore;
      details.appendChild(validFrom);

      const validTo = document.createElement('div');
      validTo.className = 'search-result-detail';
      validTo.innerHTML = '<span class="search-result-label">Valid To:</span> ' + result.notAfter;
      details.appendChild(validTo);

      // Add issuer
      const issuer = document.createElement('div');
      issuer.className = 'search-result-detail';
      issuer.style.gridColumn = '1 / span 2'; // Make it span both columns
      issuer.innerHTML = '<span class="search-result-label">Issuer:</span> ' + result.issuer;
      details.appendChild(issuer);

      // Append details to result
      resultElement.appendChild(details);

      // Append result to results container
      searchResults.appendChild(resultElement);
    });

    // Show results container
    searchResults.style.display = 'block';
  }

  // Add event listener for form submission
  form.addEventListener('submit', function(event) {
    event.preventDefault();

    // Get search query
    const searchQuery = form.querySelector('input[type="text"]').value;

    // Add class to animate elements to top
    container.classList.add('search-active');

    // Show loading spinner
    loadingSpinner.style.display = 'block';

    searchResults.style.display = 'none';

    // Call mock search function
    mockSearch(searchQuery).then(results => {
      // Hide loading spinner
      loadingSpinner.style.display = 'none';

      // Display search results
      displaySearchResults(results);
    });
  });
});
