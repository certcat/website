document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('certcat-form');
  const container = document.querySelector('.container');
  const searchBox = document.querySelector('.search-box input');
  const searchResults = document.getElementById('search-results');

  // Variable to track the last search query
  let lastSearchQuery = '';

  // Create loading spinner element
  const loadingSpinner = document.createElement('div');
  loadingSpinner.className = 'loading-spinner';
  loadingSpinner.style.display = 'none';
  container.appendChild(loadingSpinner);

  // Mock function to fetch certificate details by sha256
  function mockGetCertificateDetails(sha256) {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Generate mock certificate details
        const details = {
          sha256: sha256,
          serialNumber: Array.from(Array(32), () => Math.floor(Math.random() * 16).toString(16)).join(''),
          notBefore: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + "Z",
          notAfter: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + "Z",
          issuer: "C=US, O=Let's Encrypt, CN=R3",
          subject: `CN=www.whatever.com`,
          publicKeyAlgorithm: "RSA",
          publicKeySize: "2048 bits",
          signatureAlgorithm: "SHA256withRSA",
          extensions: [
            { name: "Basic Constraints", value: "CA:FALSE" },
            { name: "Key Usage", value: "Digital Signature, Key Encipherment" },
            { name: "Subject Alternative Name", value: "DNS:whatever.com, DNS:www.hostname.ca" }
          ],
          pem: "-----BEGIN CERTIFICATE-----\nMIIFazCCBFOgAwIBAgISA3G+jQNGhyZbj4KmQXJ0K+qMMA0GCSqGSIb3DQEBCwUA\nMEoxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MSMwIQYDVQQD\nExpMZXQncyBFbmNyeXB0IEF1dGhvcml0eSBYMzAeFw0yMDA5MjIwMzM2MDJaFw0y\nMDEyMjEwMzM2MDJaMBsxGTAXBgNVBAMTEHd3dy5leGFtcGxlLmNvbTCCASIwDQYJ\nKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKl+YuVz4YMehwM1YGwQmxRh4GoGZekf\nSfOZOGjJKkwjSL9uIhBwl3qRIGwv5C9iYnviUfCB3BoWNwVH5nR8vXiTKHYU8x0J\n...\n-----END CERTIFICATE-----"
        };

        resolve(details);
      }, 300);
    });
  }

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
          let hostname = query;
          if (subdomains[i] !== "") {
            hostname = subdomains[i] + "." + query;
          }
          // Generate a mock sha256 hash
          const sha256 = Array.from(Array(64), () => Math.floor(Math.random() * 16).toString(16)).join('');

          // Create result object
          results.push({
            hostname: hostname,
            notBefore: notBeforeDate.toISOString().split('.')[0] + "Z",
            notAfter: notAfterDate.toISOString().split('.')[0] + "Z",
            issuer: issuers[Math.floor(Math.random() * issuers.length)],
            sha256: sha256
          });
        }

        resolve(results);
      }, 200);
    });
  }

  // Function to display search results
  function displaySearchResults(results) {
    // Clear previous results
    while (searchResults.firstChild) {
      searchResults.removeChild(searchResults.firstChild);
    }

    // Get the template
    const template = document.getElementById('search-result-template');

    // Create and append result elements
    results.forEach((result, index) => {
      // Clone the template content
      const resultElement = template.content.cloneNode(true).querySelector('.search-result');
      resultElement.style.cursor = 'pointer'; // Add pointer cursor to indicate clickability

      // Set hostname
      const hostname = resultElement.querySelector('h3');
      hostname.textContent = result.hostname;

      // Set validity period
      const validFromValue = resultElement.querySelectorAll('.search-result-value')[0];
      validFromValue.textContent = result.notBefore;

      const validToValue = resultElement.querySelectorAll('.search-result-value')[1];
      validToValue.textContent = result.notAfter;

      // Set issuer
      const issuerValue = resultElement.querySelectorAll('.search-result-value')[2];
      issuerValue.textContent = result.issuer;

      // Add click event to navigate to certificate details
      resultElement.addEventListener('click', function() {
        const url = new URL(window.location);
        url.searchParams.delete('q'); // Remove search query parameter
        url.searchParams.set('sha256', result.sha256); // Add sha256 parameter
        window.history.pushState({sha256: result.sha256, hostname: result.hostname}, '', url);
        displayCert(result.sha256);
      });

      // Append result to results container
      searchResults.appendChild(resultElement);
    });

    // Show results container
    searchResults.style.display = 'block';
  }

  // Function to display certificate details
  function displayCert(sha256) {
    // Hide search results and search box, and show loading spinner
    searchResults.style.display = 'none';
    form.style.display = 'none'; // Hide the search box
    loadingSpinner.style.display = 'block';

    // Create certificate details container if it doesn't exist
    let certDetailsContainer = document.getElementById('certificate-details');
    if (!certDetailsContainer) {
      certDetailsContainer = document.createElement('div');
      certDetailsContainer.id = 'certificate-details';
      certDetailsContainer.className = 'certificate-details';
      container.appendChild(certDetailsContainer);
    } else {
      // Clear previous details
      while (certDetailsContainer.firstChild) {
        certDetailsContainer.removeChild(certDetailsContainer.firstChild);
      }
    }

    // Fetch certificate details
    mockGetCertificateDetails(sha256).then(details => {
      // Hide loading spinner
      loadingSpinner.style.display = 'none';

      // Create certificate details header
      const header = document.createElement('h2');
      header.textContent = 'Certificate Details';
      certDetailsContainer.appendChild(header);

      // Create certificate info section
      const infoSection = document.createElement('div');
      infoSection.className = 'certificate-info';

      // Get the template
      const rowTemplate = document.getElementById('certificate-detail-row-template');

      // Add certificate details
      const addDetailRow = (label, value) => {
        const rowClone = rowTemplate.content.cloneNode(true);
        const labelElement = rowClone.querySelector('.certificate-detail-label');
        const valueElement = rowClone.querySelector('.certificate-detail-value');

        labelElement.textContent = label + ':';
        valueElement.textContent = value;

        infoSection.appendChild(rowClone);
      };

      addDetailRow('SHA-256', details.sha256);
      addDetailRow('Serial Number', details.serialNumber);
      addDetailRow('Not Before', details.notBefore);
      addDetailRow('Not After', details.notAfter);
      addDetailRow('Issuer', details.issuer);
      addDetailRow('Subject', details.subject);
      addDetailRow('Public Key Algorithm', details.publicKeyAlgorithm);
      addDetailRow('Public Key Size', details.publicKeySize);
      addDetailRow('Signature Algorithm', details.signatureAlgorithm);

      // Add extensions section
      const extensionsHeader = document.createElement('h3');
      extensionsHeader.textContent = 'Extensions';
      infoSection.appendChild(extensionsHeader);

      details.extensions.forEach(ext => {
        addDetailRow(ext.name, ext.value);
      });

      // Add PEM section
      const pemHeader = document.createElement('h3');
      pemHeader.textContent = 'PEM Certificate';
      infoSection.appendChild(pemHeader);

      const pemBox = document.createElement('pre');
      pemBox.className = 'certificate-pem';
      pemBox.textContent = details.pem;
      infoSection.appendChild(pemBox);

      certDetailsContainer.appendChild(infoSection);

      // Show certificate details container
      certDetailsContainer.style.display = 'block';
    });
  }

  // Function to perform search
  function performSearch(query, updateHistory = true) {
    searchBox.value = query;
    container.classList.add('search-active');
    form.style.display = 'block'; // Show the search box
    loadingSpinner.style.display = 'block';
    searchResults.style.display = 'none';

    if (updateHistory) {
      const url = new URL(window.location);
      url.searchParams.set('q', query);
      window.history.pushState({query: query}, '', url);
    }

    // Call mock search function
    mockSearch(query).then(results => {
      // Hide loading spinner
      loadingSpinner.style.display = 'none';

      // Display search results
      displaySearchResults(results);
    });
  }

  // Add event listener for form submission
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const searchQuery = searchBox.value;

    if (searchQuery.trim()) {
      performSearch(searchQuery, searchQuery !== lastSearchQuery);
      lastSearchQuery = searchQuery;
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', function (event) {
    // Hide certificate details if visible
    const certDetailsContainer = document.getElementById('certificate-details');
    if (certDetailsContainer) {
      certDetailsContainer.style.display = 'none';
    }

    if (event.state && event.state.sha256) {
      // If state has sha256, display certificate details
      displayCert(event.state.sha256);
    } else if (event.state && event.state.query) {
      // If state has query, perform search
      performSearch(event.state.query, false);
    } else {
      // If no state, reset the page
      searchBox.value = '';
      container.classList.remove('search-active');
      searchResults.style.display = 'none';
      form.style.display = 'block'; // Show the search box
    }
  });

  // Check for search or sha256 parameter on page load
  let params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q');
  const initialSha256 = params.get('sha256');

  if (initialSha256) {
    // If sha256 parameter is present, display certificate details
    // We don't have a hostname from a search result, so we'll use the default
    form.style.display = 'none'; // Hide the search box
    displayCert(initialSha256);
  } else if (initialQuery) {
    // If query parameter is present, perform search
    form.style.display = 'block'; // Show the search box
    performSearch(initialQuery, false);
  }
});
