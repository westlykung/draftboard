let currentMatch = localStorage.getItem("currentMatch") || 1; // Start with match 1

const teamACountElem = document.getElementById("team-a-count");
const teamBCountElem = document.getElementById("team-b-count");
const saveHistoryButton = document.getElementById("save-history-button");
let allHeroes = []; // To store all heroes after fetching
let teamASelected = new Set(); // Track selected heroes for Team A in current match
let teamBSelected = new Set(); // Track selected heroes for Team B in current match
const usedByTeamA = new Set(); // Track heroes used by Team A across all matches
const usedByTeamB = new Set(); // Track heroes used by Team B across all matches
const usedHeroesCurrentMatch = new Set(); // Track heroes used in the current match
const teamANameElement = document.getElementById("team-a-name");
const teamBNameElement = document.getElementById("team-b-name");
const heroMetaAllTeam = document.getElementById("hero-meta-all-team");

const matchs = [1, 2, 3, 4, 5, 6, 7];
let usedAllHeroByTeamA = [];
let usedAllHeroByTeamB = [];
let metaHeroes = JSON.parse(localStorage.getItem("metaHeroes")) || []; // Load from localStorage or initialize as an empty array

// Fetch the heroes from the heroes.json file and default to Match 1 selection
fetch("heroes.json")
  .then((response) => response.json())
  .then((heroes) => {
    allHeroes = heroes; // Save the heroes in the allHeroes array
    loadMatchFromLocalStorage(); // Load the saved match if it exists
    displayAllHeroes(); // Display all heroes by default
  })
  .catch((error) => {
    console.error("Error fetching hero data:", error);
  });

document.getElementById("hero-filter").addEventListener("change", (event) => {
  const selectedRole = event.target.value;
  displayAllHeroes(selectedRole);
});

function displayAllHeroes(role = "all") {
  const heroContainer = document.getElementById("hero-container");
  heroContainer.innerHTML = ""; // Clear the container

  const roles = {};

  // Group heroes by role for display
  allHeroes.forEach((hero) => {
    hero.role.forEach((roleName) => {
      if (!roles[roleName]) {
        roles[roleName] = [];
      }
      roles[roleName].push(hero);
    });
  });

  // If a specific role is selected, filter heroes by that role
  const filteredRoles = role === "all" ? roles : { [role]: roles[role] };

  // Create an object to hold the result
  const allHeroUseBoothTeam = {};

  // Create a Set of all hero names in Team B for easy lookup
  const teamBHeroMap = new Map();
  usedAllHeroByTeamB.forEach((hero) => {
    teamBHeroMap.set(hero.name, hero); // Map each hero's name to the hero object
  });

  // Iterate over Team A heroes and check if their names exist in Team B
  usedAllHeroByTeamA.forEach((heroA) => {
    const heroB = teamBHeroMap.get(heroA.name); // Check if the hero exists in Team B
    if (heroB) {
      // If the hero is used by both teams, store their name, match, and teams
      allHeroUseBoothTeam[heroA.name] = {
        teamA: {
          match: heroA.match,
          lane: heroA.lane,
        },
        teamB: {
          match: heroB.match,
          lane: heroB.lane,
        },
      };
    }
  });

  // Render heroes by role group
  for (const role in filteredRoles) {
    const roleGroup = document.createElement("div");
    roleGroup.className = "role-group";

    const roleTitle = document.createElement("div");
    roleTitle.className = "role-title text-lg font-bold mb-2";
    roleTitle.textContent = role;
    roleGroup.appendChild(roleTitle);

    const roleHeroes = document.createElement("div");
    roleHeroes.className =
      "role-heroes grid gap-2 grid-cols-[repeat(auto-fill,minmax(100px,1fr))]";

    filteredRoles[role].forEach((hero) => {
      const img = document.createElement("img");
      img.src = hero.path;
      img.alt = hero.name;
      let imgClassName = "hero-image max-w-[100px] max-h-[100px] m-1.5";

      if (allHeroUseBoothTeam[hero.name]) {
        imgClassName = `${imgClassName} opacity-50`;
        img.draggable = true; // Ensure the draggable property is set
      } else {
        imgClassName = `${imgClassName} cursor-pointer`;
        img.draggable = true; // Ensure the draggable property is set
      }

      img.className = imgClassName;

      // Ensure the dragstart event is correctly attached
      img.ondragstart = (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify(hero));
      };

      img.setAttribute("data-hero-name", hero.name);
      roleHeroes.appendChild(img);
    });

    roleGroup.appendChild(roleHeroes);
    heroContainer.appendChild(roleGroup);
  }
}

// Set the active match button and deactivate the others
function setActiveMathButton(mathNumber) {
  currentMatch = mathNumber; // Set the current match to the selected one
  localStorage.setItem("currentMatch", mathNumber);
  loadMatchFromLocalStorage(); // Load the saved match (if any) for the selected match
  displayAllHeroes(); // Show all heroes whenever a new match is selected
}

function addHeroToLaneWithValidation(
  hero,
  laneImageId,
  expectedLane,
  teamSelected,
  countElem,
  usedByTeam
) {
  //   if (!existingMatch) {
  const img = document.getElementById(laneImageId);

  if (img) {
    img.src = hero.path; // Set the hero image
    img.alt = hero.name; // Set alt text for accessibility
    img.draggable = true;

    img.onclick = () => {
      removeHeroFromLane(hero, img, teamSelected, countElem, usedByTeam);
    };

    // Store the hero in the selected team with the lane information
    teamSelected.add({
      name: hero.name,
      lane: expectedLane, // Store the lane where the hero is placed
    });

    usedHeroesCurrentMatch.add(hero.name); // Add hero to the used heroes in the current match
    usedByTeam.add(hero.name); // Mark hero as used by this team

    updateHeroCount(teamSelected, countElem); // Update the count of selected heroes
  } else {
    console.log(`Element with ID ${laneImageId} not found.`);
  }
  //   }
}

function removeHeroFromLane(hero, img, teamSelected, countElem, usedByTeam) {
  img.src = ""; // Reset the image to empty
  img.alt = ""; // Clear alt text
  img.onclick = null; // Remove the click listener

  teamSelected.forEach((item) => {
    if (item.name === hero.name) {
      teamSelected.delete(item); // Remove hero from the selected team
    }
  });

  usedByTeam.delete(hero.name); // Unmark hero as used by this team
  usedHeroesCurrentMatch.delete(hero.name); // Remove from used heroes

  updateHeroCount(teamSelected, countElem); // Update the count of selected heroes
}

function updateHeroCount(teamSelected, countElem) {
  countElem.textContent = teamSelected.size;
}

// Save the current match to the history and local storage
function saveMatchToLocalStorage() {
  const matchData = {
    teamA: Array.from(teamASelected).map((hero) => ({
      name: hero.name,
      lane: hero.lane,
    })),
    teamB: Array.from(teamBSelected).map((hero) => ({
      name: hero.name,
      lane: hero.lane,
    })),
  };
  localStorage.setItem(`match-${currentMatch}`, JSON.stringify(matchData));
}

// Load match selection from local storage
function loadMatchFromLocalStorage() {
  usedAllHeroByTeamA = [];
  usedAllHeroByTeamB = [];
  const savedMatch = localStorage.getItem(`match-${currentMatch}`);
  if (savedMatch) {
    const matchData = JSON.parse(savedMatch);

    // Reset previous selection
    teamASelected.clear(); // Clear Team A selection
    teamBSelected.clear(); // Clear Team B selection
    usedHeroesCurrentMatch.clear(); // Clear the current match's used heroes

    // Load Team A's saved heroes with the correct lane
    matchData.teamA.forEach((heroObj) => {
      const hero = allHeroes.find((h) => h.name === heroObj.name);
      if (hero) {
        const laneImageId = `team-a-${heroObj.lane
          .toLowerCase()
          .replace(/ /g, "-")}-img`;
        addHeroToLaneWithValidation(
          hero,
          laneImageId,
          heroObj.lane, // Correct lane to validate
          teamASelected,
          teamACountElem,
          usedByTeamA
        );
      }
    });

    // Load Team B's saved heroes with the correct lane
    matchData.teamB.forEach((heroObj) => {
      const hero = allHeroes.find((h) => h.name === heroObj.name);
      if (hero) {
        const laneImageId = `team-b-${heroObj.lane
          .toLowerCase()
          .replace(/ /g, "-")}-img`;
        addHeroToLaneWithValidation(
          hero,
          laneImageId,
          heroObj.lane, // Correct lane to validate
          teamBSelected,
          teamBCountElem,
          usedByTeamB
        );
      }
    });

    saveHistoryButton.style.display = "none"; // Hide save button if history is already saved
  } else {
    document
      .querySelectorAll("[id^='team-a-'] img, [id^='team-b-'] img")
      .forEach((img) => {
        img.src = "images/ROVProLeague.png"; // Clear the hero image
        img.alt = ""; // Clear alt text
      });

    teamASelected.clear(); // Clear Team A selection
    teamBSelected.clear(); // Clear Team B selection
    usedHeroesCurrentMatch.clear(); // Clear the current match's used heroes

    // Update the hero count display for both teams
    updateHeroCount(teamASelected, teamACountElem);
    updateHeroCount(teamBSelected, teamBCountElem);
  }
  setActiveButton(+currentMatch);
  getHeroAllMatchs();
}

function getHeroAllMatchs() {
  for (let index = 0; index < matchs.length; index++) {
    const element = matchs[index];
    const savedMatch = localStorage.getItem(`match-${element}`);
    if (savedMatch) {
      const matchData = JSON.parse(savedMatch);
      usedAllHeroByTeamA = [
        ...usedAllHeroByTeamA,
        ...matchData["teamA"].map((x) => ({ ...x, match: element })),
      ];
      usedAllHeroByTeamB = [
        ...usedAllHeroByTeamB,
        ...matchData["teamB"].map((x) => ({ ...x, match: element })),
      ];
    }
  }
}

// Drag and drop logic for lanes
const lanes = document.querySelectorAll("[id^='team-a-'], [id^='team-b-']");
lanes.forEach((lane) => {
  lane.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  lane.addEventListener("drop", (event) => {
    event.preventDefault();
    const existingMatchs = [...teamASelected, ...teamBSelected];
    console.log(existingMatchs);
    const heroData = event.dataTransfer.getData("text/plain");
    const hero = JSON.parse(heroData);

    const laneId = lane.id; // e.g., "team-a-abyssal-dragon-lane"
    const laneName = extractLaneName(laneId); // Extract lane name

    const existingMatch = existingMatchs.find((x) => x.name === hero.name);
    if (existingMatch) {
      alert(`hero ${existingMatch.name} has been used`);
      return;
    }
    if (laneId.includes("team-a") && !existingMatch) {
      // Handle drop for Team A

      //validation team a use hero other matchs.
      const exstingOtherMatch = usedAllHeroByTeamA.find(
        (x) => x.name === hero.name
      );

      if (exstingOtherMatch) {
        alert(
          `hero ${exstingOtherMatch.name} has been used in Match ${exstingOtherMatch.match}.`
        );
        return;
      }

      if (teamASelected.size < 5) {
        addHeroToLaneWithValidation(
          hero,
          `${laneId}-img`,
          laneName,
          teamASelected,
          teamACountElem,
          usedByTeamA
        );
      } else {
        return alert("Team A has already selected 5 heroes.");
      }
    } else if (laneId.includes("team-b")) {
      //validation team a use hero other matchs.
      const exstingOtherMatch = usedAllHeroByTeamB.find(
        (x) => x.name === hero.name
      );

      if (exstingOtherMatch) {
        alert(
          `hero ${exstingOtherMatch.name} has been used in Match ${exstingOtherMatch.match}.`
        );
        return;
      }

      // Handle drop for Team B
      if (teamBSelected.size < 5 && !existingMatch) {
        addHeroToLaneWithValidation(
          hero,
          `${laneId}-img`,
          laneName,
          teamBSelected,
          teamBCountElem,
          usedByTeamB
        );
      } else {
        return alert("Team B has already selected 5 heroes.");
      }
    }
    if (teamASelected.size + teamBSelected.size === 10) {
      saveHistoryButton.style.display = "block";
    }
  });
});

// Function to extract lane name from the element's ID
function extractLaneName(laneId) {
  return laneId
    .replace("team-a-", "")
    .replace("team-b-", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word
}

saveHistoryButton.addEventListener("click", saveMatchToLocalStorage);

const buttons = document.querySelectorAll("button[data-math]");
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const matchNumber = parseInt(button.getAttribute("data-math"));
    setActiveButton(matchNumber);
    setActiveMathButton(matchNumber);
  });
});

function setActiveButton(matchNumber) {
  buttons.forEach((button) => {
    button.classList.remove("bg-green-500", "text-white");
    button.classList.add("bg-gray-200", "text-gray-800");

    if (parseInt(button.getAttribute("data-math")) === matchNumber) {
      button.classList.add("bg-green-500", "text-white");
      button.classList.remove("bg-gray-200", "text-gray-800");
    }
  });
}

// Function to initialize team names from localStorage
function initializeTeamNames() {
  const savedTeamAName = localStorage.getItem("teamAName");
  const savedTeamBName = localStorage.getItem("teamBName");

  if (savedTeamAName) {
    teamANameElement.textContent = savedTeamAName;
  }
  if (savedTeamBName) {
    teamBNameElement.textContent = savedTeamBName;
  }
}

// Save team name to localStorage
function saveTeamName(team, newName) {
  localStorage.setItem(`${team}Name`, newName);
}

// Function to turn the heading into an input field for editing
function makeEditable(teamNameElement, team) {
  teamNameElement.addEventListener("click", () => {
    const currentName = teamNameElement.textContent;

    // Create an input element
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.className = "border px-2 py-1 text-xl font-semibold";

    // Replace the h3 element with the input
    teamNameElement.replaceWith(input);

    // Function to save the new name and replace the input with heading
    const saveName = () => {
      const newName = input.value;
      teamNameElement.textContent = newName;

      // Save the new name to localStorage
      saveTeamName(team, newName);

      // Replace the input with the h3 element
      input.replaceWith(teamNameElement);
    };

    // Listen for "Enter" key or when the user clicks away (blur)
    input.addEventListener("blur", saveName);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        saveName();
      }
    });

    // Focus the input so the user can start typing immediately
    input.focus();
  });
}

// Initialize the team names when the page loads
initializeTeamNames();

// Make both team names editable
makeEditable(teamANameElement, "teamA");
makeEditable(teamBNameElement, "teamB");

// reset game
document.getElementById("reset-button").addEventListener("click", async () => {
  localStorage.removeItem(`match-${currentMatch}`);
  loadMatchFromLocalStorage(); // Load the saved match if it exists
  await displayAllHeroes(); // Display all heroes by default
});

// hero meta dynamic
// Function to render the heroes from the array (used to re-display after page reload)
function renderMetaHeroes() {
  metaHeroes.forEach((hero) => {
    addHeroToMetaList(hero);
  });
}

// Function to dynamically create and add hero elements to the DOM
function addHeroToMetaList(hero) {
  // Create the li element
  const li = document.createElement("li");
  li.className =
    "border-dashed border-2 border-gray-400 min-h-[200px] flex flex-col items-center justify-center";

  // Create the img element
  const img = document.createElement("img");
  img.src = hero.path; // Use the hero image path
  img.className = "h-[80%] p-2";
  img.alt = hero.name;

  // Create the span element
  const span = document.createElement("span");
  span.className = "text-center text-xs";
  span.textContent = hero.name; // Use the hero name

  // Append img and span to li
  li.appendChild(img);
  li.appendChild(span);

  // Add a data attribute to track hero name
  li.setAttribute("data-hero-name", hero.name);

  // Add click event to remove hero when clicked
  li.addEventListener("click", () => {
    removeHeroFromMetaList(hero.name);
  });

  // Append li to the ul
  heroMetaAllTeam.appendChild(li);
}

// Function to handle the drop event and dynamically create new hero elements
heroMetaAllTeam.addEventListener("drop", (event) => {
  event.preventDefault();

  // Get the hero data that was dragged
  const heroData = event.dataTransfer.getData("text/plain");
  const hero = JSON.parse(heroData);

  // Check if the hero already exists in the metaHeroes array
  const existingHero = metaHeroes.find((h) => h.name === hero.name);
  if (existingHero) {
    alert(`${hero.name} is already added.`);
    return;
  }

  // Add the hero to the metaHeroes array
  metaHeroes.push(hero);

  // Save the updated metaHeroes array to localStorage
  localStorage.setItem("metaHeroes", JSON.stringify(metaHeroes));

  // Add the hero to the DOM
  addHeroToMetaList(hero);
});

// Enable dragover for allowing drop
heroMetaAllTeam.addEventListener("dragover", (event) => {
  event.preventDefault();
});

function removeHeroFromMetaList(heroName) {
  // Remove the hero from the DOM
  const heroElement = document.querySelector(`[data-hero-name="${heroName}"]`);
  if (heroElement) {
    heroElement.remove(); // Remove the element from the DOM
  }

  // Remove the hero from the metaHeroes array
  metaHeroes = metaHeroes.filter((hero) => hero.name !== heroName);

  // Update the localStorage with the new metaHeroes array
  localStorage.setItem("metaHeroes", JSON.stringify(metaHeroes));
}

// Render the heroes from localStorage on page load
renderMetaHeroes();
