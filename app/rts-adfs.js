const SamlStrategy = require('passport-saml').Strategy;

module.exports = function (passport, config) {

  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.use(new SamlStrategy(
    {
      path: config.saml.path,
      entryPoint: config.saml.entryPoint,
      issuer: config.saml.issuer,
      privateCert: fs.readFileSync(config.privateCertPath, "utf-8"),
      cert: fs.readFileSync(config.certPath, "utf-8"),
      authnContext: config.authnContext,
      acceptedClockSkewMs: config.acceptedClockSkewMs,
      identifierFormat: null,
      // this is configured under the Advanced tab in AD FS relying party
      signatureAlgorithm: config.signatureAlgorithm
    },
    function (profile, cb) {
      return cb(null,
        {
          id: profile.nameID,
          email: profile.email,
          displayName: profile.displayName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          groups: profile.groups
        });
    })
  );
};