const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'vfjzde',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
