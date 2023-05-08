'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workout--container');
const workouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteWorkout = document.querySelectorAll('.delete--workout ');

let map, mapE;

class Workout {
  day = new Date().getDate();
  month = months[new Date().getMonth()];
  id = Number(new Date());
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.pace = this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace.toFixed(2);
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.speed = this.calcSpeed();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed.toFixed(2);
  }
}
// enum parodi
const workoutActivities = { Running: 'running', Cycling: 'cycling' };
//mapty-architecture INITIAL APPROACH
class App {
  #map;
  #mapE;
  #workouts =
    localStorage.length != 0
      ? JSON.parse(localStorage.getItem('workouts'))
      : [];
  constructor() {
    this._getPosition();
    this._renderFromLocalStorage();
    // }

    // submit form
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }
  _getPosition() {
    // geolocation API
    if (navigator.geolocation) {
      // this call back funs gets as the parametrs 2 function:
      // first - if everything is successfully work
      // second - if there is an error
      // here this._loadMap is a regular function, not as a method, so it will be undefined
      // FIX: add bind(this)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Your location is forbidden for this app`);
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    // render map on our page
    this.#map = L.map('map').setView(coords, 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // add marker to user clicked place
    this.#map.on('click', mapEvents => {
      this.#mapE = mapEvents;
      form.classList.remove('hidden');
      // add auto focus to the distance field
      inputDistance.focus();
    });
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input) && input > 0);
    e.preventDefault();
    if ((e.target.key = 'enter')) {
      // display marker
      const { lat, lng } = this.#mapE.latlng;
      const coords = [lat, lng];
      let workout = '';
      const distance = Number(inputDistance.value);
      const duration = Number(inputDuration.value);
      if (inputType.value === workoutActivities.Running) {
        const cadence = Number(inputCadence.value);
        if (validInputs(distance, duration, cadence)) {
          workout = new Running(distance, duration, coords, cadence);
        } else {
          alert('Input positive numbers');
        }
      } else {
        const elevation = Number(inputElevation.value);
        if (validInputs(distance, duration, elevation)) {
          workout = new Cycling(distance, duration, coords, elevation);
        } else {
          alert('Input positive numbers');
        }
      }
      // workouts_array
      this.#workouts.push(workout);
      this._renderWorkouts(workout);
      this._saveToLocalStorage();

      // // render mark
      this._renderWorkoutMarker(workout);
      //----clear form
      // hide form
      form.classList.add('hidden');
      // clear inputs
      inputDistance.value =
        inputDuration.value =
        inputCadence.value =
        inputElevation.value =
          '';
    }
    // move to pop up
    workouts.addEventListener('click', this._moveToPopup.bind(this));
    // delete a workout
    deleteWorkout.forEach(delWorkout => {
      delWorkout.addEventListener('click', e => {
        e.preventDefault();
        alert('lol');
        const delElem = e.target.closest('.workout');
        this.#workouts = this.#workouts.map((el, index) => {
          if (el.id == delElem.dataset.id) {
            delete this.#workouts[index];
          }
        });
        console.log(this.#workouts);
      });
    });
  }
  _renderWorkoutMarker(workout) {
    // render mark
    const emoji = inputType.value === 'running' ? '🏃 ' : '🚴‍♀️ ';
    const markContent =
      emoji +
      inputType.value.charAt(0).toUpperCase() +
      inputType.value.substr(1, inputType.value.length) +
      ` ${workout.day} ${workout.month}`;
    // render workout marker
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          className: `${workout.type}-popup`,
          keepInView: true,
          closeOnClick: false,
        }).setContent(markContent)
      )
      .openPopup();
  }
  // render workouts
  _renderWorkouts(workout) {
    //containerWorkouts - insert place
    let html = '';
    // workouts.map(workout => {
    let samePart = `<div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;
    if (workout.type === 'running') {
      html = `<li class="workout workout--running" data-id="${workout.id}">
      <div class = "delete--workout">X</div>
        <h2 class="workout__title">Running on ${workout.day}  ${workout.month}</h2>
        ${samePart}
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    } else {
      html = `  <li class="workout workout--cycling" data-id="${workout.id}">
      <div class = "delete--workout">X</div>
      <h2 class="workout__title">Cycling on ${workout.day}  ${workout.month}</h2>
      ${samePart}
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;
    }
    containerWorkouts.insertAdjacentHTML('afterbegin', html);
  }

  _moveToPopup(e) {
    const moveElem = e.target.closest('.workout');
    if (!moveElem) return;
    let workout = this.#workouts.find(work => work.id == moveElem.dataset.id);
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _saveToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _renderFromLocalStorage() {
    if (this.#workouts.length === 0) return;
    this.#workouts.forEach(workout => {
      this._renderWorkouts(workout);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
// create app object
const app = new App();
