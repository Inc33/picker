import BScroll from 'better-scroll';
import EventEmitter from '../util/eventEmitter';
import {extend} from '../util/lang';
import {
	createDom,
	addEvent,
	addClass,
	removeClass
} from '../util/dom';
import pickerTemplate from './picker.handlebars';
import itemTemplate from './item.handlebars';
import './picker.styl';

export default class Picker extends EventEmitter {
	constructor(options) {
		super();

		this.options = {
			data: [],
			title: '',
			selectedIndex: null,
			showCls: 'show',
                        isEmbedded: false
		};

		extend(this.options, options);

		this.data = this.options.data;
		this.pickerEl = createDom(pickerTemplate({
			data: this.data,
			title: this.options.title,
                        showPickerChoose: !this.options.isEmbedded
		}));

		document.body.appendChild(this.pickerEl);

		this.maskEl = this.pickerEl.getElementsByClassName('mask-hook')[0];
		this.wheelEl = this.pickerEl.getElementsByClassName('wheel-hook');
		this.panelEl = this.pickerEl.getElementsByClassName('panel-hook')[0];
		this.confirmEl = this.pickerEl.getElementsByClassName('confirm-hook')[0];
		this.cancelEl = this.pickerEl.getElementsByClassName('cancel-hook')[0];
		this.scrollEl = this.pickerEl.getElementsByClassName('wheel-scroll-hook');

		this._init();
	}

	_init() {
		this.selectedIndex = [];
		this.selectedVal = [];
		if (this.options.selectedIndex) {
			this.selectedIndex = this.options.selectedIndex;
		} else {
			for (let i = 0; i < this.data.length; i++) {
				this.selectedIndex[i] = 0;
			}
		}

                if (this.options.isEmbedded) {
                    this.show();
                }

		this._bindEvent();
	}

	_bindEvent() {
		addEvent(this.pickerEl, 'touchmove', (e) => {
			e.preventDefault();
		});

            if (!this.options.isEmbedded) {
		addEvent(this.confirmEl, 'click', () => {
			this.hide();

			let changed = false;
			for (let i = 0; i < this.data.length; i++) {
				let index = this.wheels[i].getSelectedIndex();
				this.selectedIndex[i] = index;

				let value = null;
				if (this.data[i].length) {
					value = this.data[i][index].value;
				}
				if (this.selectedVal[i] !== value) {
					changed = true;
				}
				this.selectedVal[i] = value;
			}

			this.trigger('picker.select', this.selectedVal, this.selectedIndex);

			if (changed) {
				this.trigger('picker.valuechange', this.selectedVal, this.selectedIndex);
			}
		});

		addEvent(this.cancelEl, 'click', () => {
			this.hide();
			this.trigger('picker.cancel');
		});
            }
	}

	_createWheel(wheelEl, i) {
		this.wheels[i] = new BScroll(wheelEl[i], {
			wheel: true,
			selectedIndex: this.selectedIndex[i]
		});
		((index) => {
			this.wheels[index].on('scrollEnd', () => {
				this.trigger('picker.change', index, this.wheels[index].getSelectedIndex());
			});
                        this.wheels[index].on('scroll', () => {
                            debugger;
                            this.trigger('picker.scroll', index, this.wheels[index].getSelectedIndex());
                        });
		})(i);
		return this.wheels[i];
	}

	show(next) {
		this.pickerEl.style.display = 'block';
		let showCls = this.options.showCls;

		window.setTimeout(() => {
                    if (!this.options.isEmbedded) {
                        addClass(this.maskEl, showCls);
                    }
			addClass(this.panelEl, showCls);

			if (!this.wheels) {
				this.wheels = [];
				for (let i = 0; i < this.data.length; i++) {
					this._createWheel(this.wheelEl, i);
				}
			} else {
				for (let i = 0; i < this.data.length; i++) {
					this.wheels[i].enable();
					this.wheels[i].wheelTo(this.selectedIndex[i]);
				}
			}
			next && next();
		}, 0);
	}

	hide() {
            if (!this.options.isEmbedded) {
		let showCls = this.options.showCls;
		removeClass(this.maskEl, showCls);
		removeClass(this.panelEl, showCls);

		window.setTimeout(() => {
			this.pickerEl.style.display = 'none';
			for (let i = 0; i < this.length; i++) {
				this.wheels[i].disable();
			}
		}, 500);
            }
	}

	refill(data, index) {
		let scrollEl = this.scrollEl[index];
		let wheel = this.wheels[index];
		if (scrollEl && wheel) {
			let oldData = this.data[index];
			this.data[index] = data;
			scrollEl.innerHTML = itemTemplate(data);

			let selectedIndex = wheel.getSelectedIndex();
			let dist = 0;
			if (oldData.length) {
				let oldValue = oldData[selectedIndex].value;
				for (let i = 0; i < data.length; i++) {
					if (data[i].value === oldValue) {
						dist = i;
						break;
					}
				}
			}
			this.selectedIndex[index] = dist;
			wheel.refresh();
			wheel.wheelTo(dist);
			return dist;
		}
	};
}