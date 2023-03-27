import videojs from 'video.js';

import SettingMenuItem from './SettingMenuItem.js';
import SettingSubOptionTitle from './SettingSubOptionTitle.js';
import SettingSubOptionItem from './SettingSubOptionItem.js';

/**
 * @param {Array<Object|number|string>} entries
 */
function parseEntries(entries, selectedIndex) {
  entries = entries.map((data, index) => {
    if (data !== null && typeof data !== 'object') {
      data = {
        value: data,
        label: data
      };
    }

    let isDefault = false;
    if (typeof selectedIndex === 'undefined' && data.default === true) {
      isDefault = true;
      selectedIndex = index;
    }

    return {
      ...data,
      index,
      default: isDefault
    };
  });

  return {
    entries,
    selected: entries[selectedIndex || 0]
  };
}

class SettingOptionItem extends SettingMenuItem {
  constructor(player, options = {}) {
    super(player, options);

    this.setEntries(this.options_.entries);

    if (!this.entries.length) {
      this.hide();
    }
  }

  createEl() {
    const { icon, label } = this.options_;
    const el = videojs.dom.createEl('li', {
      className: 'vjs-menu-item vjs-setting-menu-item',
      innerHTML: `
        <div class="vjs-icon-placeholder ${icon || ''}"></div>
        <div class="vjs-setting-menu-label">${this.localize(label)}</div>
        <div class="vjs-spacer"></div>
      `
    });

    this.selectedValueEl = videojs.dom.createEl('div', {
      className: 'vjs-setting-menu-value'
    });

    el.appendChild(this.selectedValueEl);

    return el;
  }

  setEntries(entries_ = [], selectedIndex) {
    Object.assign(this, parseEntries(entries_, selectedIndex));

    this.updateSelectedValue();

    const SubOptionItem =
      videojs.getComponent(`${this.name_}Child`) || SettingSubOptionItem;

    this.subMenuItems = [
      new SettingSubOptionTitle(this.player_, {
        label: this.options_.label,
        menu: this.menu
      }),
      ...this.entries.map(({ label, value }, index) => {
        return new SubOptionItem(this.player_, {
          index,
          label,
          value,
          parent: this,
          menu: this.menu
        });
      })
    ];
  }

  handleClick() {
    this.menu.transform(this.subMenuItems);
  }

  select(index) {
    this.selected = this.entries[index];
    this.updateSelectedValue();
  }

  update() {
    this.subMenuItems.forEach(item => {
      item.update && item.update();
    });
  }

  onChange({ index }) {
    this.select(index);
    this.update(index);
  }

  updateSelectedValue() {
    if (this.selected) {
      this.selectedValueEl.innerHTML = this.localize(this.selected.label);
    }
  }
}

videojs.registerComponent('SettingOptionItem', SettingOptionItem);

export default SettingOptionItem;
