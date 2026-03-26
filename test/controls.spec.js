import controlsPage from "../src/pages/controls.page.js";
import homePage from "../src/pages/home.page.js";
import viewsPage from "../src/pages/views.page.js";

describe("ApiDemos controls screen", () => {
  beforeEach(async () => {
    await homePage.open();
  });

  it("fills inputs and interacts with common widgets", async () => {
    await homePage.openViews();
    await viewsPage.assertLoaded();
    await viewsPage.openControls();

    await controlsPage.assertLoaded();
    await controlsPage.fillForm({ firstValue: "Alpha", secondValue: "Beta" });
    await controlsPage.setCheckboxes(true);
    await controlsPage.selectRadio(1);
    await controlsPage.setToggles(true);
    await controlsPage.selectSpinnerItem("Earth");
    await controlsPage.assertBottomTextVisible();

    const state = await controlsPage.captureState();
    await expect(state.firstInput).toBe("Alpha");
    await expect(state.secondInput).toBe("Beta");
    await expect(state.checkbox1).toBe(true);
    await expect(state.checkbox2).toBe(true);
    await expect(state.radio1).toBe(true);
    await expect(state.radio2).toBe(false);
    await expect(state.toggle1).toBe(true);
    await expect(state.toggle2).toBe(true);
    await expect(state.spinner).toContain("Earth");
  });
});
