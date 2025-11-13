const search_api_url = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const random_api_url = "https://www.themealdb.com/api/json/v1/1/random.php";
const lookup_api_url = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsGrid = document.getElementById("results-grid");
const messageArea = document.getElementById("message-area");
const randomButton = document.getElementById("random-button");
const modal = document.getElementById("recipe-modal");
const modalContent = document.getElementById("recipe-details-content");
const modalCloseBtn = document.getElementById("modal-close-btn");

const totalImages = 5;
const imagePaths = [];

for (let i = 1; i <= totalImages; i++) {
  const img = new Image();
  img.src = `image${i}.jpg`;
  imagePaths.push(img.src);
}

const bg1 = document.getElementById("bg1");
const bg2 = document.getElementById("bg2");

let currentImage = 1;
let visibleBg = bg1;
let hiddenBg = bg2;

function changeBackground() {
  hiddenBg.style.backgroundImage = `url('${imagePaths[currentImage - 1]}')`;

  hiddenBg.classList.add("visible");
  visibleBg.classList.remove("visible");

  [visibleBg, hiddenBg] = [hiddenBg, visibleBg];

  currentImage++;
  if (currentImage > totalImages) currentImage = 1;
}

window.addEventListener("load", () => {
  visibleBg.style.backgroundImage = `url('${imagePaths[0]}')`;
  visibleBg.classList.add("visible");
  currentImage = 2;
  setInterval(changeBackground, 5000);
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const searchTerm = searchInput.value.trim();
  console.log("search term:", searchTerm);

  if (searchTerm) {
    searchRecipes(searchTerm);
  } else {
    resultsGrid.innerHTML = "";
    showMessage("Please enter an ingredient in the search box", true);
  }
});

async function searchRecipes(query) {
  showMessage(`Searching for "${query}"...`, false, true);
  resultsGrid.innerHTML = "";

  try {
    const response = await fetch(`${search_api_url}${query}`);
    if (!response.ok) throw new Error("Network Error");

    const data = await response.json();
    clearMessage();
    console.log("data:", data);

    if (data.meals) {
      displayRecipes(data.meals);
    } else {
      showMessage(`No recipes found for "${query}"`);
    }
  } catch (error) {
    showMessage("Something went wrong, Please try again.", true);
  }
}

function showMessage(message, isError = false, isLoading = false) {
  messageArea.textContent = message;
  if (isError) messageArea.classList.add("error");
  if (isLoading) messageArea.classList.add("loading");
}

function clearMessage() {
  messageArea.textContent = "";
  messageArea.className = "message";
}

function displayRecipes(recipes) {
  if (!recipes || recipes.length === 0) {
    showMessage("No recipes to display!");
    return;
  }
  recipes.forEach((recipe) => {
    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe-item");
    recipeDiv.dataset.id = recipe.idMeal;

    recipeDiv.innerHTML = `
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
        <h3>${recipe.strMeal}</h3>
        `;

    resultsGrid.appendChild(recipeDiv);
  });
}

randomButton.addEventListener("click", getRandomRecipe);

async function getRandomRecipe() {
  showMessage("Fetching a random recipe...", false, true);
  resultsGrid.innerHTML = "";
  searchInput.value = "";

  try {
    const response = await fetch(random_api_url);
    if (!response.ok)
      throw new Error("Something went wrong. Please try again.");
    const data = await response.json();
    clearMessage();
    console.log("data:", data);

    if (data.meals && data.meals.length > 0) {
      displayRecipes(data.meals);
    } else {
      showMessage(
        "Failed to fetch a random recipe. Please check your connection and try again.",
        true
      );
    }
  } catch (error) {
    showMessage(
      "Failed to fetch a random recipe. Please check your connection and try again.",
      true
    );
  }
}

function showModal() {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}
resultsGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".recipe-item");

  if (card) {
    const recipeId = card.dataset.id;
    getRecipeDetails(recipeId);
  }
});

async function getRecipeDetails(id) {
  modalContent.innerHTML = '<p class="message loading">Loading Details...</p>';
  showModal();

  try {
    const response = await fetch(`${lookup_api_url}${id}`);
    if (!response.ok)
      throw new Error(
        "Failed to fetch recipe details. Check your connection and try again."
      );

    const data = await response.json();
    console.log("details:", data);

    if (data.meals && data.meals.length > 0) {
      displayRecipeDetails(data.meals[0]);
    } else {
      modalContent.innerHTML = `<p class="message error">Failed to load recipe details. Check your connection and try again.</p>`;
    }
  } catch (error) {
    modalContent.innerHTML =
      '<p class="message error">Failed to load recipe details. Check your connection and try again.</p>';
  }
}

modalCloseBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

function displayRecipeDetails(recipe) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`]?.trim();
    const measure = recipe[`strMeasure${i}`]?.trim();

    if (ingredient) {
      ingredients.push(`<li>${measure ? `${measure} ` : ""}${ingredient}</li>`);
    } else {
      break;
    }
  }

  const categoryHTML = recipe.strCategory
    ? `<h3>Category: ${recipe.strCategory}</h3>`
    : "";
  const areaHTML = recipe.strArea ? `<h3>Area: ${recipe.strArea}</h3>` : "";
  const ingredientsHTML = ingredients.length
    ? `<h3>Ingredients</h3><ul>${ingredients.join("")}</ul>`
    : "";
  const instructionsHTML = `<h3>Instructions</h3><p>${
    recipe.strInstructions
      ? recipe.strInstructions.replace(/\r?\n/g, "<br>")
      : "Instructions not available."
  }</p>`;
  const youtubeHTML = recipe.strYoutube
    ? `<h3>Video Recipe</h3><div class="video-wrapper"><a href="${recipe.strYoutube}" target="_blank">Watch on Youtube</a></div>`
    : "";

  modalContent.innerHTML = `
    <h2>${recipe.strMeal}</h2>
    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
    ${categoryHTML}
    ${areaHTML}
    ${ingredientsHTML}
    ${instructionsHTML}
    ${youtubeHTML}
    `;
}

