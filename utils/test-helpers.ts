export function setPageActive(isActive: boolean) {
  // NOTE recommended for handling "document.hidden", but currently won't work with jsdom.reconfigure()
  // ref: https://github.com/jestjs/jest/issues/7142#issuecomment-429101915
  //      https://github.com/jsdom/jsdom/pull/2392
  Object.defineProperty(document, 'hidden', {
    value: !isActive,
    configurable: true,
  });
}
