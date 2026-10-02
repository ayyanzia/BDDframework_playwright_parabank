Feature: UI & Usability
  As a customer
  I want a consistent and responsive user interface
  So that I can complete my banking tasks with ease

  @TC-UIU-001
  Scenario: Home page has correct browser title
    Given I navigate to the home page with a clean session
    Then the browser page title should contain "ParaBank"

  @TC-UIU-002
  Scenario: Registration page renders all required form fields
    Given I navigate to the registration page with a clean session
    Then I should see all registration form inputs rendered on the screen

  @TC-UIU-003
  Scenario: Login page renders username, password and submit button
    Given I navigate to the home page with a clean session
    Then I should see the login form fields

  @TC-UIU-004
  Scenario: Forgot login info link is present
    Given I navigate to the home page with a clean session
    Then I should see the link for forgot login info

  @TC-UIU-005
  Scenario: Register link is visible on home page
    Given I navigate to the home page with a clean session
    Then I should see the register account link

  @TC-UIU-006
  Scenario: Register link leads to registration form
    Given I navigate to the home page with a clean session
    When I click the register account link
    Then I should see all registration form inputs rendered on the screen

  @TC-UIU-007
  Scenario: No horizontal overflow at 1280px viewport
    Given I navigate to the home page with a clean session
    When I set the viewport dimensions to 1280 by 800
    Then the browser page document should not have horizontal overflow
