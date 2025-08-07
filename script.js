document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("certcat-form");
  const container = document.querySelector(".container");
  const searchBox = document.querySelector(".search-box input");
  const searchResults = document.getElementById("search-results");
  const loadingSpinner = document.getElementById("loading-spinner");
  const certDetailsContainer = document.getElementById("certificate-details");
  const title = document.getElementById("title")
  const pages = document.querySelectorAll("div#pages > div");

  // Navigation states
  const NavigationState = {
    HOME: "home",
    SEARCH: "search",
    CERTIFICATE: "certificate",
  };

  // Centralized navigation function
  function navigate(state, data = {}, updateHistory) {
    const url = new URL(window.location);

    // Reset: Hide all pages and clear URL parameters
    pages.forEach((page) => {
      page.style.display = "none";
      while (page.firstChild) {
        page.removeChild(page.firstChild);
      }
    });
    url.search = "";

    // Reset, nothing more to do:
    if (state === NavigationState.HOME) {
      if (updateHistory) {
        window.history.pushState({}, "", url);
      }
      container.classList.remove("search-active");
      searchBox.value = "";
      return;
    }

    // Set URL and history:
    switch (state) {
      case NavigationState.SEARCH:
        url.searchParams.set("q", data.query);
        if (updateHistory) {
          window.history.pushState({query: data.query}, "", url);
        }
        break;
      case NavigationState.CERTIFICATE:
        url.searchParams.set("sha256", data.sha256);
        if (updateHistory) {
          window.history.pushState({sha256: data.sha256}, "", url);
        }
        break;
    }

    // Set up spinner
    loadingSpinner.style.display = "block";
    console.log("loading");

    // Load and display appropriate data:
    getData(data).then((results) => {
      console.log("results ready");
      loadingSpinner.style.display = "none";
      switch (state) {
        case NavigationState.SEARCH:
          renderSearch(data, results);
          break;
        case NavigationState.CERTIFICATE:
          renderCert(data, results);
          break;
      }
    });

    switch (state) {
      case NavigationState.SEARCH:
        searchBox.value = data.query;
        searchResults.style.display = "block";
        form.style.display = "block";
        container.classList.add("search-active");
        break;
      case NavigationState.CERTIFICATE:
        certDetailsContainer.style.display = "block";
        form.style.display = "none";
        container.classList.add("search-active");
        break;
    }
  }

  // getData calls the certcat API for the requested data, returning a Promise for the appropriate JSON object
  // Of course this is a mock for now.
  function getData(data) {
    const query = JSON.stringify(data, null, 2);
    return new Promise((resolve) => {
      setTimeout(() => {
        if (data.query) {
          resolve(mockSearch(data.query));
        } else if (data.sha256) {
          resolve(mockGetCertificateDetails(data.sha256));
        } else {
          console.log("Unhandled data request:", query);
          resolve({});
        }
      }, 200);
    });
  }

  // Mock function to fetch certificate details by sha256
  function mockGetCertificateDetails(sha256) {
    // Generate mock certificate details
    return {
      sha256: sha256,
      serialNumber: Array.from(Array(32), () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join(""),
      notBefore:
        new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split(".")[0] + "Z",
      notAfter:
        new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split(".")[0] + "Z",
      issuer: "C=US, O=Let's Encrypt, CN=R3",
      subject: `CN=www.whatever.com`,
      publicKeyAlgorithm: "RSA",
      publicKeySize: "2048 bits",
      signatureAlgorithm: "SHA256withRSA",
      extensions: [
        {name: "Basic Constraints", value: "CA:FALSE"},
        {name: "Key Usage", value: "Digital Signature, Key Encipherment"},
        {
          name: "Subject Alternative Name",
          value: "DNS:whatever.com, DNS:www.hostname.ca",
        },
      ],
      pem: "-----BEGIN CERTIFICATE-----\nMIIFazCCBFOgAwIBAgISA3G+jQNGhyZbj4KmQXJ0K+qMMA0GCSqGSIb3DQEBCwUA\nMEoxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MSMwIQYDVQQD\nExpMZXQncyBFbmNyeXB0IEF1dGhvcml0eSBYMzAeFw0yMDA5MjIwMzM2MDJaFw0y\nMDEyMjEwMzM2MDJaMBsxGTAXBgNVBAMTEHd3dy5leGFtcGxlLmNvbTCCASIwDQYJ\nKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKl+YuVz4YMehwM1YGwQmxRh4GoGZekf\nSfOZOGjJKkwjSL9uIhBwl3qRIGwv5C9iYnviUfCB3BoWNwVH5nR8vXiTKHYU8x0J\n...\n-----END CERTIFICATE-----",
    };
  }

  // Mock search function that returns certificate data
  function mockSearch(query) {
    // Generate 20 mock results
    const results = [];
    const issuers = [
      "C=US, O=Let's Encrypt, CN=R3",
      "C=US, O=DigiCert Inc, CN=DigiCert TLS RSA SHA256 2020 CA1",
      "C=US, O=Amazon, CN=Amazon RSA 2048 M01",
      "C=GB, O=Sectigo Limited, CN=Sectigo RSA Domain Validation Secure Server CA",
      "C=US, O=Google Trust Services LLC, CN=GTS CA 1C3",
    ];

    const subdomains = [
      "www",
      "git",
      "www",
      "",
      "",
      "www",
      "git",
      "www",
      "",
      "",
      "www",
      "git",
      "www",
      "",
      "",
      "www",
      "git",
      "www",
      "",
      "mail",
    ];

    // Current date for reference
    const now = new Date();

    for (let i = 0; i < subdomains.length; i++) {
      // Generate random dates
      const notBeforeDate = new Date(now);
      notBeforeDate.setDate(
        notBeforeDate.getDate() - Math.floor(Math.random() * 180),
      ); // Up to 6 months ago

      const notAfterDate = new Date(notBeforeDate);
      notAfterDate.setDate(
        notAfterDate.getDate() + Math.floor(Math.random() * 365) + 90,
      ); // 3-12 months validity

      // Fake domain:
      let hostname = query;
      if (subdomains[i] !== "") {
        hostname = subdomains[i] + "." + query;
      }
      // Generate a mock sha256 hash
      const sha256 = Array.from(Array(64), () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");

      // Create result object
      results.push({
        hostname: hostname,
        notBefore: notBeforeDate.toISOString().split(".")[0] + "Z",
        notAfter: notAfterDate.toISOString().split(".")[0] + "Z",
        issuer: issuers[Math.floor(Math.random() * issuers.length)],
        sha256: sha256,
      });
    }

    return results;
  }

  // Function to display search results
  function renderSearch(query, results) {
    // Get the template
    const template = document.getElementById("search-result-template");

    // Create and append result elements
    results.forEach((result) => {
      const searchResult = template.content
        .cloneNode(true)
        .querySelector(".search-result");

      searchResult.querySelector("h3").textContent = result.hostname;
      searchResult.querySelector(".validity .value").textContent =
        `${result.notBefore} to ${result.notAfter}`;
      searchResult.querySelector(".issuer .value").textContent = result.issuer;

      // Add click event to navigate to certificate details
      searchResult.addEventListener("click", function () {
        navigate(NavigationState.CERTIFICATE, { sha256: result.sha256 }, true);
      });

      // Append result to results container
      searchResults.appendChild(searchResult);
    });

    // Show results container
    searchResults.style.display = "block";
    container.classList.add("search-active");
  }

  // Function to display certificate details
  function renderCert(query, details) {
      // Create certificate details header
      const header = document.createElement("h2");
      header.textContent = "Certificate Details";
      certDetailsContainer.appendChild(header);

      // Create certificate info section
      const infoSection = document.createElement("div");
      infoSection.className = "certificate-info";

      // Get the template
      const rowTemplate = document.getElementById(
        "certificate-detail-row-template",
      );

      // Add certificate details
      const addDetailRow = (label, value) => {
        const rowClone = rowTemplate.content.cloneNode(true);
        const labelElement = rowClone.querySelector(
          ".certificate-detail-label",
        );
        const valueElement = rowClone.querySelector(
          ".certificate-detail-value",
        );

        labelElement.textContent = label + ":";
        valueElement.textContent = value;

        infoSection.appendChild(rowClone);
      };

      addDetailRow("SHA-256", details.sha256);
      addDetailRow("Serial Number", details.serialNumber);
      addDetailRow("Not Before", details.notBefore);
      addDetailRow("Not After", details.notAfter);
      addDetailRow("Issuer", details.issuer);
      addDetailRow("Subject", details.subject);
      addDetailRow("Public Key Algorithm", details.publicKeyAlgorithm);
      addDetailRow("Public Key Size", details.publicKeySize);
      addDetailRow("Signature Algorithm", details.signatureAlgorithm);

      // Add extensions section
      const extensionsHeader = document.createElement("h3");
      extensionsHeader.textContent = "Extensions";
      infoSection.appendChild(extensionsHeader);

      details.extensions.forEach((ext) => {
        addDetailRow(ext.name, ext.value);
      });

      // Add PEM section
      const pemHeader = document.createElement("h3");
      pemHeader.textContent = "PEM Certificate";
      infoSection.appendChild(pemHeader);

      const pemBox = document.createElement("pre");
      pemBox.className = "certificate-pem";
      pemBox.textContent = details.pem;
      infoSection.appendChild(pemBox);

      certDetailsContainer.appendChild(infoSection);
  }

  // Add event listener for form submission
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const searchQuery = searchBox.value;

    if (searchQuery.trim()) {
      navigate(NavigationState.SEARCH, { query: searchQuery }, true);
    }
  });

  // Click page title to go home
  title.addEventListener("click", function (event) {
    event.preventDefault();
    navigate(NavigationState.HOME, {}, true);
  })

  // Handle browser back/forward buttons
  window.addEventListener("popstate", function (event) {
    if (event.state && event.state.sha256) {
      navigate(NavigationState.CERTIFICATE, { sha256: event.state.sha256 }, false);
    } else if (event.state && event.state.query) {
      navigate(NavigationState.SEARCH, { query: event.state.query }, false);
    } else {
      navigate(NavigationState.HOME, {}, false);
    }
  });

  // Check for search or sha256 parameter on page load
  let params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q");
  const initialSha256 = params.get("sha256");

  if (initialSha256) {
    navigate(NavigationState.CERTIFICATE, { sha256: initialSha256 }, false);
  } else if (initialQuery) {
    navigate(NavigationState.SEARCH, { query: initialQuery }, false);
  } else {
    navigate(NavigationState.HOME, {}, false);
  }
});
