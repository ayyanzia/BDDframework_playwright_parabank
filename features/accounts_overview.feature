Feature: Accounts Overview
  As an authenticated user
  I want to view my account details and balances
  So that I can monitor my financial status

  Background:
    Given I am logged in with the primary user
    And I navigate to the accounts overview page

  @TC-AOV-001
  Scenario Outline: Accounts overview table visible after login
    When I reload the accounts overview page run <run>
    Then I should see the accounts overview table

    Examples:
      | run |
      | 1   |
      | 2   |

  @TC-AOV-002
  Scenario: At least one account row is present
    Then the accounts overview table should contain at least one account row

  @TC-AOV-003
  Scenario: Click account number shows activity page
    When I click the first account number link
    Then I should see the account details page

  @TC-AOV-004
  Scenario: Total balance cell shows a dollar amount
    Then the total balance cell should show a formatted dollar amount
