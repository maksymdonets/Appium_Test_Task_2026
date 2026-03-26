import basePage from "./base.page.js";
import { resourceId } from "../support/locators.js";

const buttonsPage = {
  ...basePage,

  elements: {
    toggles: {
      sample: () => $(resourceId("button_toggle")),
    },
    buttons: {
      normal: () => $(resourceId("button_normal")),
      small: () => $(resourceId("button_small")),
    },
  },

  async assertLoaded() {
    await this.waitForVisible(this.elements.toggles.sample());
    await this.waitForVisible(this.elements.buttons.normal());
    await this.waitForVisible(this.elements.buttons.small());
  },

  async toggleSample() {
    await this.tap(this.elements.toggles.sample());
  },

  async isSampleToggleChecked() {
    return this.isChecked(this.elements.toggles.sample());
  },

  async readLabels() {
    return {
      toggle: await this.getTextValue(this.elements.toggles.sample()),
      normal: await this.getTextValue(this.elements.buttons.normal()),
      small: await this.getTextValue(this.elements.buttons.small()),
    };
  },
};

export default buttonsPage;
