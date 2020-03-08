// Logger service should we need error logging when we deploy.
// Service currently uses console.error only to log errors to console.
function init() {}

function log(error) {
  console.error(error);
}

export default {
  init,
  log
};
