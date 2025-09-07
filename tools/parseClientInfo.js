/**
 * @param {Object} source
 * @param {Object} [source.handshake]
 * @param {Object} [source.handshake.headers]
 * @param {Object} [source.headers]
 * @returns {{
 *   userAgent: string,
 *   device: string,
 *   browser: string,
 *   os: string,
 *   connectionDate: string
 * }}
 */
module.exports = (source) => {
  const headers = source?.handshake?.headers || source?.headers;
  const ua =
    typeof headers?.["user-agent"] === "string"
      ? headers["user-agent"]
      : "unknown";
  const date = new Date().toISOString();

  const getDeviceType = (ua) =>
    /mobile|android|iphone|ipad|ipod/i.test(ua) ? "Mobile" : "Desktop";

  const getBrowser = (ua) => {
    if (/edg/i.test(ua)) return "Edge";
    if (/opr\//i.test(ua)) return "Opera";
    if (/chrome|crios/i.test(ua)) return "Chrome";
    if (/firefox|fxios/i.test(ua)) return "Firefox";
    if (/safari/i.test(ua) && !/chrome|crios|edg|opr/i.test(ua))
      return "Safari";
    return "Unknown";
  };

  const getOS = (ua) => {
    if (/windows nt/i.test(ua)) return "Windows";
    if (/android/i.test(ua)) return "Android";
    if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
    if (/mac os x/i.test(ua)) return "macOS";
    if (/linux/i.test(ua)) return "Linux";
    return "Unknown";
  };

  return {
    userAgent: ua,
    device: getDeviceType(ua),
    browser: getBrowser(ua),
    os: getOS(ua),
    connectionDate: date,
  };
};
