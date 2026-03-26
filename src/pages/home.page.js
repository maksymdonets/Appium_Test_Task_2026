import basePage from "./base.page.js";
import { dismissSystemDialogs } from "../support/system-dialogs.js";

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
    await browser.startActivity({
      appPackage: "io.appium.android.apis",
      appActivity: ".ApiDemos",
      appWaitPackage: "io.appium.android.apis",
      appWaitActivity: "io.appium.android.apis.*"
    });
    await dismissSystemDialogs();
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
