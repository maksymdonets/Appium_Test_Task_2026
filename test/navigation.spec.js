import homePage from "../src/pages/home.page.js";
import viewsPage from "../src/pages/views.page.js";

describe("ApiDemos navigation", () => {
  beforeEach(async () => {
    await homePage.open();
  });

  it("opens the main menu and reaches the Views section", async () => {
    await homePage.openViews();

    await viewsPage.assertLoaded();
    await expect(await viewsPage.elements.list.buttonsItem()).toBeDisplayed();
    await expect(await viewsPage.elements.list.controlsItem()).toBeDisplayed();
  });
});
