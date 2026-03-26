import basePage from "./base.page.js";

const viewsPage = {
  ...basePage,

  elements: {
    list: {
      animationItem: () => viewsPage.waitForText("Animation"),
      buttonsItem: () => viewsPage.waitForText("Buttons"),
      controlsItem: () => viewsPage.waitForText("Controls"),
    },
  },

  async assertLoaded() {
    await this.elements.list.animationItem();
    await this.elements.list.buttonsItem();
  },

  async openButtons() {
    await this.tapText("Buttons");
  },

  async openControls() {
    await this.tapText("Controls");
  },
};

export default viewsPage;
