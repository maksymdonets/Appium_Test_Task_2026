const dialogSelectors = [
  'id=android:id/aerr_wait',
  'id=android:id/button2',
  'id=android:id/aerr_close',
  'id=android:id/button1'
];

async function clickIfVisible(selector) {
  const element = await $(selector);

  if (!(await element.isExisting()) || !(await element.isDisplayed())) {
    return false;
  }

  await element.click();
  return true;
}

export async function dismissSystemDialogs(maxAttempts = 4) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let dismissed = false;

    for (const selector of dialogSelectors) {
      if (await clickIfVisible(selector)) {
        dismissed = true;
        await browser.pause(750);
        break;
      }
    }

    if (!dismissed) {
      return;
    }
  }
}
