// W pliku HourPicker.js
import BaseWidget from '../BaseWidget.js';
import utils from '../../utils.js';
import { select, settings } from '../../settings.js';

class HourPicker extends BaseWidget {
  constructor(wrapper) {
    super(wrapper, settings.hours.open);
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.input);
    thisWidget.dom.output = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.output);

    console.log('HourPicker INIT!');
    console.log('Wrapper:', thisWidget.dom.wrapper);
    console.log('Input:', thisWidget.dom.input);
    console.log('Output:', thisWidget.dom.output);

    // eslint-disable-next-line no-undef
    rangeSlider.create(thisWidget.dom.input);

    thisWidget.dom.input.addEventListener('input', function () {
      thisWidget.value = thisWidget.dom.input.value;
      console.log('Slider changed:', thisWidget.value);
    });

    thisWidget.value = thisWidget.dom.input.value;
  }

  parseValue(value) {
    return utils.numberToHour(value);
  }

  isValid() {
    return true;
  }

  renderValue() {
    const thisWidget = this;
    thisWidget.dom.output.innerHTML = thisWidget.value;
  }
}

export default HourPicker;
