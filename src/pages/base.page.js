import { scrollIntoView, textSelector } from "../support/locators.js";

const basePage = {
  async resolveElement(target) {
    if (typeof target === "string") {
      return $(target);
    }

    return target;
  },

  async waitForVisible(target, timeout = 20000) {
    const element = await this.resolveElement(target);
    await element.waitForDisplayed({ timeout });
    return element;
  },

  async waitForText(text, timeout = 20000) {
    return this.waitForVisible(textSelector(text), timeout);
  },

  async waitForEnabled(target, timeout = 20000) {
    const element = await this.waitForVisible(target, timeout);
    await element.waitForEnabled({ timeout });
    return element;
  },

  async tap(target, timeout = 20000) {
    const element = await this.waitForEnabled(target, timeout);
    await element.click();
    return element;
  },

  async tapText(text, timeout = 20000) {
    const element = await $(scrollIntoView(text));
    await element.waitForDisplayed({ timeout });
    await element.click();
    return element;
  },

  async scrollToText(text) {
    return $(scrollIntoView(text));
  },

  async type(target, value) {
    const element = await this.waitForVisible(target);
    await element.clearValue();
    await element.setValue(value);
    return element;
  },

  async isChecked(target) {
    const element = await this.resolveElement(target);
    return (await element.getAttribute("checked")) === "true";
  },

  async getTextValue(target) {
    const element = await this.resolveElement(target);
    const visibleText = await element.getText();
    if (visibleText) {
      return visibleText;
    }

    return element.getAttribute("text");
  },
};

export default basePage;
