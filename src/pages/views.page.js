import basePage from "./base.page.js";

const viewsPage = {
  ...basePage,

  elements: {
    list: {
      animationItem: () => viewsPage.waitForText("1. Animation"),
      buttonsItem: () => viewsPage.waitForText("1. Buttons"),
      controlsItem: () => viewsPage.waitForText("1. Theme White"),
    },
  },

  async assertLoaded() {
    await this.elements.list.animationItem();
    await this.elements.list.buttonsItem();
  },

  async openButtons() {
    await this.tapText("1. Buttons");
  },

  async openControls() {
    await this.tapText("1. Theme White");
  },
};

export default viewsPage;
