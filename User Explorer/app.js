const API_URL = "https://api.github.com";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

const results = document.getElementById("results");
const loader = document.getElementById("loader");
const status = document.getElementById("status");

const pagination = document.getElementById("pagination");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageNumber = document.getElementById("pageNumber");

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

const themeBtn = document.getElementById("themeBtn");


let currentSearch = "";
let currentPage = 1;


/* ==========================================
   SEARCH USERS
========================================== */

searchForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const username = searchInput.value.trim();

    if (!username) {
        showStatus("Please enter a username.", "error");
        return;
    }

    currentSearch = username;
    currentPage = 1;

    searchUsers();

});


/* ==========================================
   AJAX REQUEST
========================================== */

async function searchUsers() {

    showLoader();

    clearStatus();

    results.innerHTML = "";

    try {

        /*
         * AJAX request using Fetch API
         *
         * This sends an HTTP GET request to
         * GitHub's third-party REST API.
         */

        const response = await fetch(
            `${API_URL}/search/users?q=${encodeURIComponent(currentSearch)}&page=${currentPage}&per_page=12`
        );


        /*
         * HTTP error handling
         */

        if (!response.ok) {

            if (response.status === 403) {
                throw new Error(
                    "GitHub API rate limit exceeded. Please try again later."
                );
            }

            throw new Error(
                `API Error: ${response.status}`
            );

        }


        /*
         * Convert JSON response
         * into JavaScript object.
         */

        const data = await response.json();


        /*
         * Check whether users were found.
         */

        if (data.items.length === 0) {

            showStatus(
                "No users found.",
                "error"
            );

            pagination.classList.add("hidden");

            return;
        }


        /*
         * Display users.
         */

        displayUsers(data.items);


        /*
         * Show pagination.
         */

        pagination.classList.remove("hidden");

        pageNumber.textContent =
            `Page ${currentPage}`;


        prevBtn.disabled =
            currentPage === 1;


        /*
         * GitHub's search API returns a
         * total_count property.
         *
         * We use it to determine whether
         * another page might exist.
         */

        nextBtn.disabled =
            currentPage * 12 >= data.total_count;


    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Something went wrong.",
            "error"
        );

        pagination.classList.add("hidden");

    } finally {

        hideLoader();

    }

}


/* ==========================================
   DISPLAY USERS
========================================== */

function displayUsers(users) {

    results.innerHTML = "";

    users.forEach(user => {

        const card = document.createElement("article");

        card.className = "user-card";

        card.innerHTML = `

            <img
                src="${user.avatar_url}"
                alt="${user.login}"
            >

            <h3>
                ${user.login}
            </h3>

            <p class="username">
                GitHub User
            </p>

            <button
                class="view-btn"
                onclick="viewUser('${user.login}')"
            >
                View Profile
            </button>

        `;

        results.appendChild(card);

    });

}


/* ==========================================
   GET USER DETAILS
========================================== */

async function viewUser(username) {

    showModalLoading();


    try {

        /*
         * First AJAX request:
         * Get user profile
         */

        const userResponse = await fetch(
            `${API_URL}/users/${username}`
        );


        if (!userResponse.ok) {
            throw new Error(
                "Unable to load user profile."
            );
        }


        const user = await userResponse.json();


        /*
         * Second AJAX request:
         * Get repositories
         */

        const repoResponse = await fetch(
            `${API_URL}/users/${username}/repos?sort=updated&per_page=5`
        );


        if (!repoResponse.ok) {
            throw new Error(
                "Unable to load repositories."
            );
        }


        const repos = await repoResponse.json();


        /*
         * Display complete information
         */

        displayUserModal(user, repos);


    } catch (error) {

        modalBody.innerHTML = `

            <div class="error">
                ${error.message}
            </div>

        `;

    }

}


/* ==========================================
   DISPLAY MODAL
========================================== */

function displayUserModal(user, repos) {

    let repositoryHTML = "";


    if (repos.length === 0) {

        repositoryHTML = `
            <p>No public repositories.</p>
        `;

    } else {

        repositoryHTML = repos.map(repo => `

            <div class="repo">

                <a
                    href="${repo.html_url}"
                    target="_blank"
                >
                    ${repo.name}
                </a>

                <p>
                    ${repo.description || "No description"}
                </p>

            </div>

        `).join("");

    }


    modalBody.innerHTML = `

        <div class="modal-profile">

            <img
                src="${user.avatar_url}"
                alt="${user.login}"
            >

            <h2>
                ${user.name || user.login}
            </h2>

            <p class="username">
                @${user.login}
            </p>

            <p>
                ${user.bio || "No bio available."}
            </p>

        </div>


        <div class="stats">

            <div class="stat">

                <strong>
                    ${user.followers}
                </strong>

                Followers

            </div>


            <div class="stat">

                <strong>
                    ${user.following}
                </strong>

                Following

            </div>


            <div class="stat">

                <strong>
                    ${user.public_repos}
                </strong>

                Repositories

            </div>

        </div>


        <div class="repositories">

            <h3>
                Recent Repositories
            </h3>

            ${repositoryHTML}

        </div>

    `;

}


/* ==========================================
   MODAL
========================================== */

function showModalLoading() {

    modal.classList.remove("hidden");

    modalBody.innerHTML = `

        <div class="loader">

            <div class="spinner"></div>

            <p>
                Loading user information...
            </p>

        </div>

    `;

}


closeModal.addEventListener(
    "click",
    function() {

        modal.classList.add("hidden");

    }
);


/*
 * Close modal when clicking outside
 */

modal.addEventListener(
    "click",
    function(event) {

        if (event.target === modal) {

            modal.classList.add("hidden");

        }

    }
);


/* ==========================================
   PAGINATION
========================================== */

prevBtn.addEventListener(
    "click",
    function() {

        if (currentPage > 1) {

            currentPage--;

            searchUsers();

        }

    }
);


nextBtn.addEventListener(
    "click",
    function() {

        currentPage++;

        searchUsers();

    }
);


/* ==========================================
   LOADING
========================================== */

function showLoader() {

    loader.classList.remove("hidden");

}

function hideLoader() {

    loader.classList.add("hidden");

}


/* ==========================================
   STATUS
========================================== */

function showStatus(message, type) {

    status.innerHTML = `
        <p class="${type}">
            ${message}
        </p>
    `;

}

function clearStatus() {

    status.innerHTML = "";

}


/* ==========================================
   DARK MODE
========================================== */

themeBtn.addEventListener(
    "click",
    function() {

        document.body.classList.toggle("dark");

        const darkMode =
            document.body.classList.contains("dark");


        themeBtn.textContent =
            darkMode ? "☀️" : "🌙";


        /*
         * Save preference
         */

        localStorage.setItem(
            "darkMode",
            darkMode
        );

    }
);


/*
 * Restore theme
 */

if (
    localStorage.getItem("darkMode") === "true"
) {

    document.body.classList.add("dark");

    themeBtn.textContent = "☀️";

}
