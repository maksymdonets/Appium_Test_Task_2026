export const APP_PACKAGE = 'io.appium.android.apis';

function escapeUiSelectorValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function resourceId(id) {
  return `android=new UiSelector().resourceId("${APP_PACKAGE}:id/${id}")`;
}

export function textSelector(text) {
  const escaped = escapeUiSelectorValue(text);
  return `android=new UiSelector().text("${escaped}")`;
}

export function textContainsSelector(text) {
  const escaped = escapeUiSelectorValue(text);
  return `android=new UiSelector().textContains("${escaped}")`;
}

export function scrollIntoView(text) {
  const escaped = escapeUiSelectorValue(text);
  return `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("${escaped}"))`;
}

export function accessibilityId(value) {
  return `~${value}`;
}
