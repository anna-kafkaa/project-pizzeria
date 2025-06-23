// src/js/components/Booking.js

import { select, classNames, settings, templates } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './Classes_v2/DatePicker.js';
import HourPicker from './Classes_v2/HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.selectedTable = null; // Właściwość do przechowywania ID wybranego stolika

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initTables();
    thisBooking.initActions();

    // Możesz tutaj dla pewności sprawdzić po inicjalizacji
    console.log('Constructor: thisBooking.dom.starters po render i init:', thisBooking.dom.starters);
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(allResponses => {
        return Promise.all(allResponses.map(res => res.json()));
      })
      .then(([bookings, eventsCurrent, eventsRepeat]) => {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat === 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (!thisBooking.booked[date]) thisBooking.booked[date] = {};

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (!thisBooking.booked[date][hourBlock]) thisBooking.booked[date][hourBlock] = [];

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    const allAvailable = typeof thisBooking.booked[thisBooking.date] === 'undefined'
      || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] === 'undefined';

    for (let table of thisBooking.dom.tables) {
      const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }

      // Resetowanie klasy 'selected' jeśli stolik staje się zajęty lub zmieniamy datę/godzinę
      if (table.classList.contains(classNames.booking.tableSelected)) {
        if (table.classList.contains(classNames.booking.tableBooked) || thisBooking.selectedTable !== tableId) {
          table.classList.remove(classNames.booking.tableSelected);
          if (thisBooking.selectedTable === tableId) { // Tylko jeśli to był nasz wybrany stolik
             thisBooking.selectedTable = null;
          }
        }
      }
    }

    // Dodatkowe sprawdzenie, czy thisBooking.selectedTable jest nadal dostępne po updateDOM
    if (thisBooking.selectedTable !== null) {
      const selectedDomTable = thisBooking.dom.wrapper.querySelector(select.booking.tablesById + thisBooking.selectedTable);
      if (selectedDomTable && selectedDomTable.classList.contains(classNames.booking.tableBooked)) {
        selectedDomTable.classList.remove(classNames.booking.tableSelected);
        thisBooking.selectedTable = null;
      }
    }
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    // Po wstawieniu HTML do DOM, możemy bezpiecznie pobrać wszystkie elementy
    // Upewnij się, że selektory są poprawne w settings.js
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    // TUTAJ ZMIANA: Usunąłem thisBooking.dom.starters z render()

    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);

    console.log('--- Render diagnostyka DOM elements ---');
    console.log('Sprawdź, czy formularz i inne elementy są dostępne w render()');
    console.log('thisBooking.dom.form:', thisBooking.dom.form); // Powinno być elementem
    console.log('--- Koniec render diagnostyki ---');
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', () => thisBooking.updateDOM());
  }

  initTables() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {
        const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));

        if (table.classList.contains(classNames.booking.tableBooked)) {
          alert('Ten stolik jest już zajęty. Wybierz inny.');
          return;
        }

        if (table.classList.contains(classNames.booking.tableSelected)) {
          table.classList.remove(classNames.booking.tableSelected);
          thisBooking.selectedTable = null;
          console.log(`Stolik ${tableId} odznaczony.`);
        } else {
          for (let otherTable of thisBooking.dom.tables) {
            otherTable.classList.remove(classNames.booking.tableSelected);
          }
          table.classList.add(classNames.booking.tableSelected);
          thisBooking.selectedTable = tableId;
          console.log(`Stolik ${tableId} zaznaczony.`);
        }
      });
    }
  }

  initActions() {
    const thisBooking = this;

    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;

    if (thisBooking.selectedTable === null) {
      alert('Proszę wybrać stolik przed wysłaniem rezerwacji.');
      return;
    }

    // === KLUCZOWA ZMIANA: Pobieramy starters TUTAJ, tuż przed ich użyciem ===
    // W momencie wywołania sendBooking, mamy pewność, że formularz i jego elementy
    // (w tym checkboxy) są już w pełni załadowane w DOM.
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);

    console.log('--- Rozpoczynam diagnostykę starters w sendBooking ---');
    console.log('thisBooking.dom.starters (pobrane w sendBooking):', thisBooking.dom.starters);
    console.log('Typ thisBooking.dom.starters:', typeof thisBooking.dom.starters);
    console.log('Liczba checkboxów znalezionych:', thisBooking.dom.starters.length);
    // === KONIEC DEBUGOWANIA sendBooking ===

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: thisBooking.selectedTable,
      duration: thisBooking.hoursAmountWidget.value,
      ppl: thisBooking.peopleAmountWidget.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    // Uzupełnianie tablicy 'starters' na podstawie zaznaczonych checkboxów
    for (let starter of thisBooking.dom.starters) {
      console.log('Przetwarzany starter element:', starter);
      console.log('Starter checked status:', starter.checked);
      console.log('Starter value:', starter.value);

      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    console.log('Ostateczna tablica starters w payload:', payload.starters);
    console.log('Payload do wysłania:', payload);
    console.log('--- Koniec diagnostyki starters w sendBooking ---');


    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    console.log('Startery przed wysłaniem:', payload.starters);


    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(parsedResponse => {
        console.log('Rezerwacja wysłana pomyślnie:', parsedResponse);
        thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
        thisBooking.updateDOM();
        alert('Rezerwacja została wysłana pomyślnie!');
      })
      .catch(error => {
        console.error('Błąd podczas wysyłania rezerwacji:', error);
        alert('Wystąpił błąd podczas rezerwacji. Spróbuj ponownie.');
      });
  }
}

export default Booking;