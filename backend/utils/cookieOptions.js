const isProduction = process.env.NODE_ENV === "production";

const getBaseCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
});

const getAuthCookieOptions = (maxAge) => {
  const options = getBaseCookieOptions();
  if (typeof maxAge === "number") {
    options.maxAge = maxAge;
  }
  return options;
};

const getClearCookieOptions = () => getBaseCookieOptions();

module.exports = {
  getAuthCookieOptions,
  getClearCookieOptions,
};
