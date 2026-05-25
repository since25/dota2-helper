// Frontend logic will go here
function fallbackEscapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function fallbackFormatStructuredOutput(text) {
    return fallbackEscapeHtml(text);
}

const formatStructuredOutput = window.DotaOutputFormatter?.formatStructuredOutput ?? fallbackFormatStructuredOutput;

const heroForm = document.getElementById('heroForm');
const outputDiv = document.getElementById('output');
const errorMessageP = document.getElementById('error-message');
const heroDatalist = document.getElementById('heroList');
const loadingSpinner = document.getElementById('loadingSpinner');
const clearFormBtn = document.getElementById('clearFormBtn');
const yourHeroRoleSelect = document.getElementById('yourHeroRole');
const allyLabels = [
    document.getElementById('ally1-label'),
    document.getElementById('ally2-label'),
    document.getElementById('ally3-label'),
    document.getElementById('ally4-label')
];
const submitButton = heroForm.querySelector('button[type="submit"]');

// Get all hero input elements
const heroInputs = [
    document.getElementById('yourHero'),
    document.getElementById('ally1'),
    document.getElementById('ally2'),
    document.getElementById('ally3'),
    document.getElementById('ally4'),
    document.getElementById('opponent1'),
    document.getElementById('opponent2'),
    document.getElementById('opponent3'),
    document.getElementById('opponent4'),
    document.getElementById('opponent5')
];

let validHeroNames = new Set(); // To store valid canonical hero names for validation
let heroAliasMap = new Map(); // Maps display names and aliases to canonical hero names
const ROLES = ['Safe Lane', 'Midlane', 'Offlane', 'Support', 'Hard Support'];
const ROLE_LABELS = {
    'Safe Lane': '优势路',
    'Midlane': '中路',
    'Offlane': '劣势路',
    'Support': '四号位',
    'Hard Support': '五号位'
};

// let heroIconMap = {}; // Removed: No longer fetching icons

const HERO_ABBREVIATIONS = {
    'Ancient Apparition': genAbbreviations('aa'),
    'Anti-Mage': genAbbreviations('am'),
    'Bounty Hunter': genAbbreviations('bh'),
    'Chaos Knight': genAbbreviations('ck'),
    'Crystal Maiden': genAbbreviations('cm'),
    'Dark Seer': genAbbreviations('ds'),
    'Death Prophet': genAbbreviations('dp'),
    'Dragon Knight': genAbbreviations('dk'),
    'Elder Titan': genAbbreviations('et'),
    'Faceless Void': genAbbreviations('fv'),
    'Keeper of the Light': genAbbreviations('kotl'),
    'Legion Commander': genAbbreviations('lc'),
    'Lone Druid': genAbbreviations('ld'),
    'Monkey King': genAbbreviations('mk'),
    'Nature\'s Prophet': genAbbreviations('np'),
    'Night Stalker': genAbbreviations('ns'),
    'Outworld Destroyer': genAbbreviations('od'),
    'Phantom Assassin': genAbbreviations('pa'),
    'Phantom Lancer': genAbbreviations('pl'),
    'Queen of Pain': genAbbreviations('qop'),
    'Sand King': genAbbreviations('sk'),
    'Shadow Demon': genAbbreviations('sd'),
    'Shadow Fiend': genAbbreviations('sf'),
    'Skywrath Mage': genAbbreviations('sm'),
    'Spirit Breaker': genAbbreviations('sb'),
    'Templar Assassin': genAbbreviations('ta'),
    'Windranger': genAbbreviations('wr'),
    'Winter Wyvern': genAbbreviations('ww'),
    'Witch Doctor': genAbbreviations('wd'),
    'Wraith King': genAbbreviations('wk')
};

function genAbbreviations(baseAbbr) {
    return [
        baseAbbr.toUpperCase(),
        baseAbbr.charAt(0).toUpperCase() + baseAbbr.slice(1).toLowerCase(),
        baseAbbr
    ];
}

// Populates the role dropdown for the user's hero
function populateRoleDropdown() {
    ROLES.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = ROLE_LABELS[role] || role;
        yourHeroRoleSelect.appendChild(option);
    });
}

// Updates the labels for the ally heroes based on the user's selected role
function updateAllyRoles() {
    const selectedRole = yourHeroRoleSelect.value;
    const remainingRoles = ROLES.filter(r => r !== selectedRole);
    allyLabels.forEach((label, index) => {
        if (label) {
            // e.g., "Offlane"
            label.textContent = ROLE_LABELS[remainingRoles[index]] || remainingRoles[index];
        }
    });
}

// Function to fetch heroes and populate the datalist + icon map
async function populateHeroData() {
    try {
        const response = await fetch('/api/heroes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const heroesData = await response.json(); // Expecting { localized_name, zh_name, display_name, aliases }

        // Clear existing datalist options
        heroDatalist.innerHTML = ''; 
        validHeroNames.clear();
        heroAliasMap.clear();
        // heroIconMap = {}; // Removed

        // Populate datalist and the Set of valid names
        heroesData.forEach(hero => {
            const option = document.createElement('option');
            option.value = hero.display_name || hero.localized_name;
            heroDatalist.appendChild(option);
            validHeroNames.add(hero.localized_name); // Add to Set for validation

            const canonical = hero.localized_name;
            const keys = [
                canonical,
                hero.display_name,
                hero.zh_name,
                ...(hero.aliases || [])
            ];

            keys.filter(Boolean).forEach(alias => {
                heroAliasMap.set(alias.trim().toLowerCase(), canonical);
            });
        });

        console.log('Hero datalist populated.');
        submitButton.disabled = false; // Enable submit button once heroes are loaded

    } catch (error) {
        console.error('Error fetching or populating heroes:', error);
        errorMessageP.textContent = '英雄列表加载失败，请刷新页面。';
        submitButton.disabled = true; // Keep submit disabled if load fails
    }
}

function autoCorrectInputs(input) {
    const aliasMatch = heroAliasMap.get(input.value.trim().toLowerCase());
    if (aliasMatch) {
        input.value = aliasMatch;
        return;
    }

    for (const [heroName, abbrSet] of Object.entries(HERO_ABBREVIATIONS)) {
        if (abbrSet.includes(input.value.trim())) {
            input.value = heroName;
            break;
        }
    }
    const separator = input.value.includes('-') ? '-' : ' ' // Anti-Mage

    let heroName = input.value
        .trim()
        .replace(/\s+/g, ' ') // handle multiple spaces between words; e.g. 'Phantom  Lancer'

    if (heroName.toLowerCase() === 'keeper of the light') {
        input.value = 'Keeper of the Light'
    } else {
        const splitLength = heroName.split(separator).length;
        if (splitLength <= 2) {
            heroName = heroName
                .split(separator)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(separator);
        }

        // Auto correct hero name if possible
        if (validHeroNames.has(heroName)) {
            input.value = heroName;
        }
    }
}

// Function to validate hero inputs (with real-time feedback hints)
function validateHeroInputs(isFinalCheck = false) {
    let isValid = true;
    let currentSelections = {};
    let firstErrorMessage = '';

    // Clear previous invalid styles first
    heroInputs.forEach(input => input.classList.remove('invalid'));
    if (isFinalCheck) errorMessageP.textContent = ''; // Clear main error only on submit check

    for (const input of heroInputs) {
        const heroName = input.value.trim();
        let fieldError = null;

        if (heroName === '') {
            if (isFinalCheck) fieldError = '请填写全部英雄。'; // Only show required error on final submit
            input.classList.add('invalid');
            isValid = false;
        } else if (!validHeroNames.has(heroName)) {
            fieldError = `"${heroName}" 不是有效英雄。`;
            input.classList.add('invalid');
            isValid = false;
        } else if (currentSelections[heroName]) {
            fieldError = `"${heroName}" 被重复选择。`;
            input.classList.add('invalid');
            // Also mark the previously selected input as invalid
            currentSelections[heroName].inputElement.classList.add('invalid');
            isValid = false;
        } else {
            currentSelections[heroName] = { inputElement: input }; // Record valid selection
            input.classList.remove('invalid'); // Explicitly remove invalid if previously marked
        }

        // Store the *first* error message encountered for display
        if (fieldError && !firstErrorMessage) {
            firstErrorMessage = fieldError;
        }
    }

    // Display the first error message if performing the final check before submit
    if (isFinalCheck) {
        errorMessageP.textContent = firstErrorMessage;
    }

    return isValid;
}

// Call the function to populate datalist when the page loads
document.addEventListener('DOMContentLoaded', () => {
    populateHeroData();
    populateRoleDropdown();
    updateAllyRoles(); // Set initial ally roles
});

// Add event listener for when the user changes their role selection
yourHeroRoleSelect.addEventListener('change', updateAllyRoles);

// Real-time validation hints on input blur (losing focus)
heroInputs.forEach(input => {
    input.addEventListener('blur', () => {
        autoCorrectInputs(input);
        validateHeroInputs(false); // Run validation, but don't show main error message yet
    });
    // Clear specific input error on typing
    input.addEventListener('input', () => {
        input.classList.remove('invalid');
         // If user types, clear the main error message as well
        if (errorMessageP.textContent) {
             errorMessageP.textContent = '';
        }
    });
});

// Handle form submission
heroForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    heroInputs.forEach(input => autoCorrectInputs(input));

    if (!validateHeroInputs(true)) { // Perform final validation check
        outputDiv.innerHTML = ''; // Clear any previous results or errors
        loadingSpinner.style.display = 'none';
        return;
    }

    // Show loading spinner, hide output
    loadingSpinner.style.display = 'flex';
    outputDiv.style.display = 'none';
    outputDiv.innerHTML = ''; // Clear previous output
    errorMessageP.textContent = ''; // Clear validation errors
    submitButton.disabled = true; // Disable button during request
    clearFormBtn.disabled = true;

    // --- Construct the payload with hero and role information ---
    const yourRole = yourHeroRoleSelect.value;
    const yourHeroName = document.getElementById('yourHero').value;
    const remainingRoles = ROLES.filter(r => r !== yourRole);

    // My Team
    const myTeam = [{ role: yourRole, hero: yourHeroName }];
    const allyInputs = [
        document.getElementById('ally1'),
        document.getElementById('ally2'),
        document.getElementById('ally3'),
        document.getElementById('ally4')
    ];
    allyInputs.forEach((input, index) => {
        myTeam.push({ role: remainingRoles[index], hero: input.value });
    });

    // Opponent Team (roles are fixed from HTML labels)
    const opponentRoles = ['Safe Lane', 'Midlane', 'Offlane', 'Support', 'Hard Support'];
    const opponentInputs = [
        document.getElementById('opponent1'),
        document.getElementById('opponent2'),
        document.getElementById('opponent3'),
        document.getElementById('opponent4'),
        document.getElementById('opponent5')
    ];
    const opponentTeam = opponentInputs.map((input, index) => {
        return { role: opponentRoles[index], hero: input.value };
    });

    const selectedData = { myTeam, opponentTeam };

    try {
        console.log('Sending API request with heroes and roles:', selectedData);
        const headers = { 'Content-Type': 'application/json' };

        const response = await fetch('/api/get-tips', {
            method: 'POST',
            headers,
            body: JSON.stringify(selectedData),
        });

        const data = await response.json();

        if (response.status === 429) {
            outputDiv.innerHTML = `
                <div class="error-box">
                    <strong>请求次数已达上限：</strong>请稍后再试。
                </div>
            `;
            loadingSpinner.style.display = 'none';
            outputDiv.style.display = 'block';
            submitButton.disabled = false;
            clearFormBtn.disabled = false;
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || `HTTP error ${response.status}`);
        }

        // Process and display structured results
        outputDiv.innerHTML = formatStructuredOutput(data.tips);

    } catch (error) {
        console.error('Error fetching tips:', error);
        // Display error in a more prominent way (e.g., within the output div for now)
        outputDiv.innerHTML = `<div class="error-box"><strong>请求失败：</strong> ${error.message}</div>`;
    } finally {
        // Hide spinner, show output, re-enable buttons
        loadingSpinner.style.display = 'none';
        outputDiv.style.display = 'block';
        submitButton.disabled = false;
        clearFormBtn.disabled = false;
    }
});

// Clear form button
clearFormBtn.addEventListener('click', () => {
    heroForm.reset(); // Reset form fields
    heroInputs.forEach(input => input.classList.remove('invalid')); // Clear validation styles
    errorMessageP.textContent = ''; // Clear error message
    outputDiv.innerHTML = ''; // Clear results area
    outputDiv.style.display = 'block'; // Ensure output area is visible
    loadingSpinner.style.display = 'none'; // Ensure spinner is hidden
});
