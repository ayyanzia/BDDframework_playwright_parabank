Feature: Navigation
  As an authenticated user
  I want to navigate through the links in the left panel
  So that I can access various parts of the banking application

  Background:
    Given I am logged in with the primary user

  @TC-NAV-001
  Scenario Outline: Navigation check for various links
    When I click the navigation link "<link>"
    Then I should see the right panel container visible

    Examples:
      | link                |
      | Open New Account    |
      | Accounts Overview   |
      | Transfer Funds      |
      | Bill Pay            |
      | Find Transactions   |
      | Update Contact Info |
      | Request Loan        |

  @TC-NAV-002
  Scenario: All expected nav links present after login
    Then I should see all of the navigation links in the left panel

  @TC-NAV-003
  Scenario: Home page shows login form without authentication
    Given I navigate to the home page with a clean session
    Then I should see the login form fields

  @TC-NAV-004
  Scenario: Log Out link visible after login
    Then the log out link should be visible

  @TC-NAV-005
  Scenario: Protected URL without login redirects or shows error
    Given I navigate to the accounts overview page with a clean session
    Then I should see an error or redirect to the home page

  @TC-NAV-006
  Scenario: Main logo is visible on page
    Then the main logo should be visible
