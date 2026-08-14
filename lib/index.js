//#region src/index.ts
/** Host shim for the browser-only image theme plugin. */
const name = "image-theme";
/** No host services are required; all behavior runs inside the web client. */
function apply() {}
//#endregion
export { apply, name };
