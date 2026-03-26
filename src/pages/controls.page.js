import basePage from "./base.page.js";
import { resourceId, textSelector } from "../support/locators.js";

const controlsPage = {
  ...basePage,

  elements: {
    themes: {
      light: () => controlsPage.waitForText("1. Light Theme"),
    },
    actions: {
      saveButton: () => $(resourceId("button")),
      disabledSaveButton: () => $(resourceId("button_disabled")),
    },
    form: {
      firstInput: () => $(resourceId("edit")),
      spinner: () => $(resourceId("spinner1")),
      spinnerValue: async () => (await controlsPage.elements.form.spinner()).$('android.widget.TextView'),
    },
    toggles: {
      checkbox1: () => $(resourceId("check1")),
      checkbox2: () => $(resourceId("check2")),
      radio1: () => $(resourceId("radio1")),
      radio2: () => $(resourceId("radio2")),
      toggle1: () => $(resourceId("toggle1")),
      toggle2: () => $(resourceId("toggle2")),
      star: () => $(resourceId("star")),
    },
    content: {
      bottomMarker: () => controlsPage.waitForText("textColorPrimary"),
      spinnerOption: (label) => $(textSelector(label)),
    },
  },

  async openLightTheme() {
    await this.tap(this.elements.themes.light());
  },

  async assertLoaded() {
    await this.waitForVisible(this.elements.actions.saveButton());
    await this.waitForVisible(this.elements.form.firstInput());
    await this.waitForVisible(this.elements.form.spinner());
  },

  async fillForm({ firstValue }) {
    await this.type(this.elements.form.firstInput(), firstValue);
  },

  async setCheckboxes(checked = true) {
    if ((await this.isChecked(this.elements.toggles.checkbox1())) !== checked) {
      await this.tap(this.elements.toggles.checkbox1());
    }

    if ((await this.isChecked(this.elements.toggles.checkbox2())) !== checked) {
      await this.tap(this.elements.toggles.checkbox2());
    }
  },

  async selectRadio(option) {
    const radios = {
      1: this.elements.toggles.radio1(),
      2: this.elements.toggles.radio2(),
    };

    const target = radios[option];
    if (!target) {
      throw new Error(`Unsupported radio option: ${option}`);
    }

    if (!(await this.isChecked(target))) {
      await this.tap(target);
    }
  },

  async setToggles(checked = true) {
    if ((await this.isChecked(this.elements.toggles.toggle1())) !== checked) {
      await this.tap(this.elements.toggles.toggle1());
    }

    if ((await this.isChecked(this.elements.toggles.toggle2())) !== checked) {
      await this.tap(this.elements.toggles.toggle2());
    }
  },

  async selectSpinnerItem(label) {
    await this.tap(this.elements.form.spinner());
    await this.tap(this.elements.content.spinnerOption(label));
  },

  async assertBottomTextVisible() {
    await this.elements.content.bottomMarker();
  },

  async captureState() {
    const spinnerValue = await this.elements.form.spinnerValue();

    return {
      firstInput: await this.getTextValue(this.elements.form.firstInput()),
      checkbox1: await this.isChecked(this.elements.toggles.checkbox1()),
      checkbox2: await this.isChecked(this.elements.toggles.checkbox2()),
      radio1: await this.isChecked(this.elements.toggles.radio1()),
      radio2: await this.isChecked(this.elements.toggles.radio2()),
      toggle1: await this.isChecked(this.elements.toggles.toggle1()),
      toggle2: await this.isChecked(this.elements.toggles.toggle2()),
      spinner: await this.getTextValue(spinnerValue),
    };
  },
};

export default controlsPage;
