// search.js
// import Chart from '/chart.js/auto';

let athletes = [];
let events = [];
let selectedAthleteName = '';
let selectedAthleteID = ''; 
let selectedEvent = null;
let startYearValue = 2006; 
let endYearValue = 2025; 
let minEventsValue = 3; 
let recencyBiasValue = 0; 

import {plotData} from './plot.js'

document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('searchBar');
    const eventDropdown = document.getElementById('eventDropdown');

    searchBar.addEventListener('input', () => {
        filterAthletes();
        eventDropdown.innerHTML = '<option value="">Select an event</option>';
        hideComparatorList(); 
    });

    const sliders = ['startYearSlider', 'endYearSlider', 'minEventsSlider', 'recencyBiasSlider'];
    sliders.forEach(sliderId => {
        const sliderElement = document.getElementById(sliderId);
        sliderElement.addEventListener('input', () => {
            updateAdvancedSettings();
            validateAndFetchComparators(); 
        });
    });

    fetchAthleteNames();
    fetchEventCodes();
});

async function fetchAthleteNames() {
    try {
        const response = await fetch('http://127.0.0.1:3000/athletes');
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const data = await response.json();
        athletes = data;
        filterAthletes();
    } catch (error) {
        console.error('Error fetching athlete data:', error);
    }
}

async function fetchEventCodes() {
  try {
      const response = await fetch('http://127.0.0.1:3000/events');
      if (!response.ok) {
          throw new Error('Network response was not ok.');
      }
      const data = await response.json();
      events = data;
  } catch (error) {
      console.error('Error fetching event codes:', error);
  }
}

function getEventName(eventCode) {
  const event = events.find(e => e.event_code === eventCode);
  return event ? event.event_name : null; 
}

function filterAthletes() {
    const searchInput = document.getElementById('searchBar').value.trim().toLowerCase(); 
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';

    if (searchInput.length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    searchResults.style.display = 'block';

    const filteredAthletes = athletes.filter(athlete => athlete.name.toLowerCase().includes(searchInput));
    displaySearchResults(filteredAthletes);
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    results.forEach(athlete => {
        const div = document.createElement('div');
        div.className = 'search-result';

        const schoolLogo = document.createElement('img');
        schoolLogo.className = 'school-logo';
        schoolLogo.src = getSchoolLogoSrc(athlete.school);
        div.appendChild(schoolLogo);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = athlete.name;
        nameSpan.className = 'athlete-name';
        div.appendChild(nameSpan);

        const yearsActiveSpan = document.createElement('span');
        yearsActiveSpan.textContent = athlete.years_active;
        yearsActiveSpan.className = 'years-active';
        div.appendChild(yearsActiveSpan);

        div.addEventListener('click', () => {
            selectAthlete(athlete.name, athlete.athlete_id);
        });

        searchResults.appendChild(div);
    });
}

function selectAthlete(name, athlete_id) {
    selectedAthleteName = name;
    selectedAthleteID = athlete_id;
    document.getElementById('searchBar').value = selectedAthleteName; 
    document.getElementById('searchResults').style.display = 'none'; 
    fetchRelevantEvents(selectedAthleteID);
}

async function fetchRelevantEvents(athlete_id) {
    try {
        const response = await fetch(`http://127.0.0.1:3000/relevant_events?athlete_id=${encodeURIComponent(athlete_id)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const events = await response.json();
        populateDropdown(events);
    } catch (error) {
        console.error('Error fetching relevant events:', error);
    }
}

function populateDropdown(events) {
    const dropdownMenu = document.getElementById('eventDropdown');
    
    while (dropdownMenu.options.length > 1) {
        dropdownMenu.remove(1);
    }

    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event; 
        option.textContent = getEventName(event);
        dropdownMenu.appendChild(option);
    });

    dropdownMenu.addEventListener('change', function() {
        selectedEvent = (this.value);
        showAdvancedSettings();
        validateAndFetchComparators();  
    });
}

function getSchoolLogoSrc(schoolName) {
    return `images/${schoolName.toLowerCase().replace(/ /g, '')}.png`;
}

function showAdvancedSettings() {
    document.getElementById('advancedSettings').style.display = 'block';
}

function updateAdvancedSettings() {
    startYearValue = document.getElementById('startYearSlider').value;
    endYearValue = document.getElementById('endYearSlider').value;
    minEventsValue = document.getElementById('minEventsSlider').value;
    recencyBiasValue = document.getElementById('recencyBiasSlider').value;

    document.getElementById('startYearLabel').innerText = startYearValue;
    document.getElementById('endYearLabel').innerText = endYearValue;
    document.getElementById('minEventsLabel').innerText = minEventsValue;
    document.getElementById('recencyBiasLabel').innerText = recencyBiasValue;
}

function hideComparatorList() {
    const comparatorList = document.getElementById('comparatorList');
    comparatorList.innerHTML = '';
    comparatorList.style.display = 'none';
}

function createComparatorList(comparators) {
    const comparatorList = document.getElementById('comparatorList');
    comparatorList.innerHTML = '';
  
    comparatorList.style.display = 'block';
  
    let hoveredComparator = null;
    let clickedComparator = null;
  
    function updateComparator() {
      let comparator = null;
      if (hoveredComparator !== null) {
        comparator = hoveredComparator;
      } else if (clickedComparator !== null) {
        comparator = clickedComparator;
      }
      if (comparator) {
          preparePlotData(comparator);
      }
    }
  
    comparators.forEach((comparator) => {
        const athlete = athletes.find(a => a.athlete_id === comparator.athlete_id);
        if (athlete) {
            const listItem = document.createElement('li');
            listItem.textContent = `${athlete.name}`;
            listItem.style.cursor = 'pointer';
  
            listItem.addEventListener('mouseover', function() {
              hoveredComparator = comparator;
              updateComparator();
            });
  
            listItem.addEventListener('mouseout', function() {
              hoveredComparator = null;
              updateComparator();
            });
  
            listItem.addEventListener('click', function(event) {
                event.stopPropagation();
                const allListItems = comparatorList.querySelectorAll('li');
                allListItems.forEach(item => {
                    item.classList.remove('selected');
                    item.style.fontWeight = 'normal';
                });
  
                listItem.classList.add('selected');
                listItem.style.fontWeight = 'bold';
  
                clickedComparator = comparator;
                updateComparator();
            });
  
            comparatorList.appendChild(listItem);
        }
    });
  
    document.addEventListener('click', function(event) {
      if (!comparatorList.contains(event.target)) {
        clickedComparator = null;
        const allListItems = comparatorList.querySelectorAll('li');
        allListItems.forEach(item => {
            item.classList.remove('selected');
            item.style.fontWeight = 'normal';
        });
        updateComparator();
      }
    });
  
    comparatorList.style.display = 'block';
}

async function fetchComparators(athlete_id, id2, start_year, end_year, min_events, recency_bias) {
    try {
        const response = await fetch(`http://127.0.0.1:3000/compare_trajectory?id1=${encodeURIComponent(athlete_id)}&id2=${encodeURIComponent(id2)}&first_year=${encodeURIComponent(start_year)}&last_year=${encodeURIComponent(end_year)}&min_events=${encodeURIComponent(min_events)}&recency_bias=${encodeURIComponent(recency_bias)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const comparators = await response.json();
        createComparatorList(comparators);
    } catch (error) {
        console.error('Error fetching comparators:', error);
    }
}

function validateAndFetchComparators() {
    if (selectedAthleteID) {
        fetchComparators(selectedAthleteID, selectedEvent, startYearValue, endYearValue, minEventsValue, recencyBiasValue);
    } else {
        hideComparatorList(); 
    }
}

async function fetchTrajectory(athlete_id, id2) {
  try {
      const response = await fetch(`http://127.0.0.1:3000/athlete_trajectory?id1=${encodeURIComponent(athlete_id)}&id2=${encodeURIComponent(id2)}`);
      if (!response.ok) {
          throw new Error('Network response was not ok.');
      }
      const trajectory = await response.json();
      return trajectory;
  } catch (error) {
      console.error('Error fetching athlete trajectories:', error);
  }
}

async function preparePlotData(comparator) {
    const athleteTrajectory = await fetchTrajectory(selectedAthleteID, selectedEvent);
    const comparatorTrajectory = await fetchTrajectory(comparator.athlete_id, selectedEvent);
    const comparatorName = athletes.find(a => a.athlete_id === comparator.athlete_id).name;
    const dists = comparator.dists;
    const pos = comparator.pos;
    const selectedEventName = getEventName(Number(selectedEvent));
    console.log(selectedAthleteName,
        comparatorName, 
        selectedEventName, 
        athleteTrajectory, 
        comparatorTrajectory, 
        dists, 
        pos)
    plotData();
}

