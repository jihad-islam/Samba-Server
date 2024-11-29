let fullFileList = []; // Store the full list of files and folders

// Login functionality
document
  .getElementById("loginForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = result.message;
    messageDiv.style.color = response.ok ? "green" : "red";

    if (response.ok) {
      window.location.href = result.redirect; // Redirect to shared folders page
    }
  });

// Load shared files
// Load shared files
async function loadSharedFiles() {
  const response = await fetch("/files", { method: "GET" });

  const fileList = document.getElementById("fileList");
  fileList.innerHTML = ""; // Clear the list before loading new items

  if (!response.ok) {
    fileList.innerHTML = "<li>Failed to load shared files.</li>";
    return;
  }

  const result = await response.json();
  fullFileList = result.files || []; // Save the full list of files and folders

  // Display all files initially
  displayFiles(fullFileList);
}

// Function to display files (used for both initial and filtered file lists)
function displayFiles(files) {
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = ""; // Clear the list before displaying new files

  if (files && files.length > 0) {
    files.forEach((file) => {
      const listItem = document.createElement("li");
      listItem.classList.add(
        "bg-gray-700",
        "p-6",
        "rounded-lg",
        "shadow",
        "hover:shadow-lg",
        "hover:scale-105",
        "transition",
        "flex",
        "items-center",
        "justify-between"
      );
      listItem.innerHTML = `
        <div class="flex items-center gap-4">
          <img
            src="${
              file.type === "folder"
                ? "/static/icons/folder.png"
                : "/static/icons/file.png"
            }"
            alt="${file.type} icon"
            class="h-10 w-10"
          />
          <span class="text-lg font-medium truncate text-white">${
            file.name
          }</span>
        </div>
      `;

      if (file.type === "file") {
        const downloadIcon = document.createElement("button");
        downloadIcon.classList.add(
          "p-2",
          "bg-gradient-to-r",
          "from-purple-500",
          "via-pink-500",
          "to-yellow-500",
          "hover:from-yellow-500",
          "hover:to-purple-500",
          "rounded-full",
          "transition"
        );
        downloadIcon.innerHTML = `
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 16v-8m0 8l-4-4m4 4l4-4m-7 8h10a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2z"
            />
          </svg>
        `;
        downloadIcon.addEventListener("click", () => handleDownload(file.name));
        listItem.appendChild(downloadIcon);
      }

      fileList.appendChild(listItem);
    });
  } else {
    fileList.innerHTML = "<li>No files found in the shared folder.</li>";
  }
}

// Download functionality
async function handleDownload(filename) {
  try {
    const response = await fetch(`/download/${filename}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to download the file.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    alert(`Error downloading file: ${error.message}`);
  }
}

// Upload functionality (single button triggers file input dialog)
document.getElementById("uploadIcon")?.addEventListener("click", function () {
  const fileInput = document.getElementById("uploadFile");
  fileInput.click(); // Trigger the hidden file input dialog
});

// Upload file when user selects a file
document
  .getElementById("uploadFile")
  ?.addEventListener("change", async function () {
    const file = this.files[0]; // Get the selected file

    if (!file) {
      alert("No file selected!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const uploadMessage = document.getElementById("uploadMessage");
    uploadMessage.textContent = "Uploading file...";
    uploadMessage.style.color = "orange";

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        uploadMessage.textContent = result.message;
        uploadMessage.style.color = "green";
        loadSharedFiles(); // Reload the file list after successful upload
      } else {
        uploadMessage.textContent = result.message || "Error uploading file.";
        uploadMessage.style.color = "red";
      }
    } catch (error) {
      uploadMessage.textContent = `Error during file upload: ${error.message}`;
      uploadMessage.style.color = "red";
    }
  });

// Search functionality
document.getElementById("searchInput")?.addEventListener("input", handleSearch);

async function handleSearch() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) {
    displayFiles(fullFileList); // Show all files if search input is empty
    return;
  }

  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "<li>Searching...</li>"; // Temporary message

  try {
    // Send the query to the server
    const response = await fetch(`/search?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error("Failed to fetch search results");
    }

    const result = await response.json();

    if (result.results && result.results.length > 0) {
      // Display the filtered list
      displayFiles(result.results);
    } else {
      fileList.innerHTML = "<li>No files found.</li>";
    }
  } catch (error) {
    console.error("Error during search:", error);
    fileList.innerHTML = "<li>Error occurred during search.</li>";
  }
}

// Automatically load shared files when the page loads
if (document.getElementById("fileList")) {
  loadSharedFiles();
}

// Add Enter key functionality for search bar
document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

// Logout functionality
document
  .getElementById("logoutButton")
  ?.addEventListener("click", async function () {
    try {
      // Send a POST request to the logout endpoint
      const response = await fetch("/logout", { method: "POST" });

      if (response.ok) {
        // Redirect to login page after logout
        window.location.href = "/"; // Redirect to the login page
      } else {
        alert("Failed to logout");
      }
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  });

// Automatically load shared files when the page loads
if (document.getElementById("fileList")) {
  loadSharedFiles();
}
