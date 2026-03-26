import basePage from "./base.page.js";

const homePage = {
  ...basePage,

  routes: {
    home: ".ApiDemos",
  },

  elements: {
    menu: {
      viewsItem: () => homePage.waitForText("Views"),
      preferenceItem: () => homePage.waitForText("Preference"),
    },
  },

  async open() {
    await this.assertLoaded();
  },

  async assertLoaded() {
    await this.elements.menu.viewsItem();
    await this.elements.menu.preferenceItem();
  },

  async openViews() {
    await this.tapText("Views");
  },
};

export default homePage;
