import buttonsPage from "../src/pages/buttons.page.js";
import homePage from "../src/pages/home.page.js";
import viewsPage from "../src/pages/views.page.js";

describe("ApiDemos buttons screen", () => {
  beforeEach(async () => {
    await homePage.open();
  });

  it("toggles the sample button control", async () => {
    await homePage.openViews();
    await viewsPage.assertLoaded();
    await viewsPage.openButtons();

    await buttonsPage.assertLoaded();
    await expect(await buttonsPage.isSampleToggleChecked()).toBe(false);

    await buttonsPage.toggleSample();
    await expect(await buttonsPage.isSampleToggleChecked()).toBe(true);
  });

  it("renders all button variants with stable labels", async () => {
    await homePage.openViews();
    await viewsPage.openButtons();

    await buttonsPage.assertLoaded();

    const labels = await buttonsPage.readLabels();
    await expect(labels.normal).toContain("Normal");
    await expect(labels.small).toContain("Small");
    await expect(["OFF", "ON"]).toContain(labels.toggle);
  });
});
