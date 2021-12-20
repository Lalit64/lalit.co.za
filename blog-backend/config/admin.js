module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '8cafe572501ba4657d118f0651f66c2b'),
  },
});
