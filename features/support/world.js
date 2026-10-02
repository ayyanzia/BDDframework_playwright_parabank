const { setWorldConstructor } = require('@cucumber/cucumber');

class CustomWorld {
  constructor() {
    this.page = null;
  }
}

setWorldConstructor(CustomWorld);
