// src/js/components/Booking.js

import { select, classNames, settings, templates } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './Classes_v2/DatePicker.js'; // Upewnij się, że ścieżka jest poprawna
import HourPicker from './Classes_v2/HourPicker.js'; // Upewnij się, że ścieżka jest poprawna

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.selectedTable = null; // Właściwość do przechowywania ID wybranego stolika

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initTables(); // Inicjalizacja obsługi kliknięć stolików
    thisBooking.initActions(); // Inicjalizacja obsługi formularza
  }

  getData() {
    const thisBooking = this;

    // Pobieranie dat z DatePicker
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    // Parametry dla zapytań do API
    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    // Konstruowanie URL-i dla zapytań
    const urls = {
      booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
    };

    // Wykonanie wszystkich zapytań równocześnie
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
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {}; // Obiekt do przechowywania zajętych stolików

    // Przetwarzanie rezerwacji
    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    // Przetwarzanie bieżących wydarzeń
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    // Przetwarzanie powtarzalnych wydarzeń
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat === 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    // Aktualizacja DOM po przetworzeniu danych
    thisBooking.updateDOM();
  }

  // Metoda do oznaczania stolików jako zajęte
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (!thisBooking.booked[date]) thisBooking.booked[date] = {};

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (!thisBooking.booked[date][hourBlock]) thisBooking.booked[date][hourBlock] = [];

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  // Metoda do aktualizacji wizualnego stanu stolików w DOM
  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    // Sprawdzamy, czy w ogóle są jakieś rezerwacje dla danej daty/godziny
    const allAvailable = typeof thisBooking.booked[thisBooking.date] === 'undefined'
      || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] === 'undefined';

    for (let table of thisBooking.dom.tables) {
      const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));

      // Jeśli stolik jest zajęty, dodaj klasę 'booked'
      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        // Jeśli stolik jest dostępny, upewnij się, że nie ma klasy 'booked'
        table.classList.remove(classNames.booking.tableBooked);
      }

      // Ważne: Resetowanie klasy 'selected' przy każdej zmianie daty/godziny
      // Jeśli stolik był wcześniej zaznaczony, ale zmieniła się data/godzina
      // i jest teraz zajęty lub po prostu zmieniamy parametry,
      // to powinien stracić status 'selected'.
      table.classList.remove(classNames.booking.tableSelected);
    }
    // Również resetujemy thisBooking.selectedTable na null, aby odzwierciedlić brak wybranego stolika
    thisBooking.selectedTable = null;
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    // Referencje do elementów DOM
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables); // Lista wszystkich elementów stolików
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    // Nasłuchiwanie na zdarzenie 'updated' z widżetów
    // Kiedy data, godzina, liczba osób lub godzin się zmienia, aktualizujemy DOM
    thisBooking.dom.wrapper.addEventListener('updated', () => thisBooking.updateDOM());
  }

  // Metoda do obsługi kliknięć na stoliki
  initTables() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {
        const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));

        // 1. Sprawdź, czy stolik jest ZAJĘTY
        if (table.classList.contains(classNames.booking.tableBooked)) {
          alert('Stolik niedostępny');
          return; // Zakończ funkcję, jeśli stolik jest zajęty
        }

        // 2. Jeśli stolik jest WŁAŚNIE ZAZNACZONY (ma już klasę 'selected')
        if (table.classList.contains(classNames.booking.tableSelected)) {
          // Odznacz go (usuń klasę 'selected')
          table.classList.remove(classNames.booking.tableSelected);
          thisBooking.selectedTable = null; // Wyzeruj wybrany stolik w instancji Booking
          console.log(`Stolik ${tableId} odznaczony.`); // Debugging
        } else {
          // 3. Jeśli stolik jest WOLNY i NIE jest zaznaczony
          // Najpierw usuń klasę 'selected' ze WSZYSTKICH innych stolików,
          // aby tylko jeden mógł być zaznaczony naraz.
          for (let otherTable of thisBooking.dom.tables) {
            otherTable.classList.remove(classNames.booking.tableSelected);
          }
          
          // Następnie zaznacz kliknięty stolik (dodaj klasę 'selected')
          table.classList.add(classNames.booking.tableSelected);
          thisBooking.selectedTable = tableId; // Zapisz ID wybranego stolika
          console.log(`Stolik ${tableId} zaznaczony.`); // Debugging
        }
      });
    }
  }

  // Metoda do obsługi wysyłania formularza
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

    // Sprawdzenie, czy stolik został wybrany przed wysłaniem rezerwacji
    if (thisBooking.selectedTable === null) { // Sprawdzamy, czy wybrano stolik
      alert('Proszę wybrać stolik przed wysłaniem rezerwacji.');
      return; // Zakończ funkcję, jeśli stolik nie jest wybrany
    }

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: thisBooking.selectedTable, // Używa wybranego stolika
      duration: thisBooking.hoursAmountWidget.value,
      ppl: thisBooking.peopleAmountWidget.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then((response) => response.json())
      .then((parsedResponse) => {
        // Po udanej rezerwacji, oznaczamy stolik jako zajęty w aplikacji
        thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
        thisBooking.updateDOM(); // Wywołaj updateDOM, aby wizualnie zaktualizować status stolików
        console.log('Rezerwacja wysłana pomyślnie:', parsedResponse); // Debugging
      })
      .catch(error => {
        console.error('Błąd podczas wysyłania rezerwacji:', error);
        alert('Wystąpił błąd podczas rezerwacji. Spróbuj ponownie.');
      });
  }
}

export default Booking;