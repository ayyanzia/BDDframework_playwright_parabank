Feature: Open New Account
  As an authenticated user
  I want to open a new checking or savings account
  So that I can separate my savings or daily expenses

  Background:
    Given I am logged in with the primary user

  @TC-OAC-001
  Scenario Outline: Open a new Checking account
    When I request to open a new checking account run <run>
    Then I should see the confirmation for checking account opened

    Examples:
      | run |
      | 1   |
      | 2   |

  @TC-OAC-002
  Scenario Outline: Open a new Savings account
    When I request to open a new savings account run <run>
    Then I should see the confirmation for savings account opened

    Examples:
      | run |
      | 1   |
      | 2   |

  @TC-OAC-003
  Scenario: Open Account page accessible via nav link
    When I click the navigation link "Open New Account"
    Then the open account page should load correctly
