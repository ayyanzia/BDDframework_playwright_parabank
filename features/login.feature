Feature: User Login
  As a registered customer
  I want to log in
  So that I can access my online banking features

  Background:
    Given I navigate to the home page

  @TC-LOG-001
  Scenario Outline: Login with valid credentials
    When I log in with username and password run <run>
    Then I should see the accounts overview page
    And I log out of my account

    Examples:
      | run |
      | 1   |
      | 2   |

  @TC-LOG-002
  Scenario: Login with wrong password shows error
    When I log in with username and wrong password
    Then I should see a login failure error message

  @TC-LOG-003
  Scenario: Login with non-existent username shows error
    When I log in with a non-existent username
    Then I should see a login failure error message

  @TC-LOG-004
  Scenario: Login rejected with empty fields
    When I log in with empty fields
    Then I should see an empty fields error message

  @TC-LOG-005
  Scenario: Logout redirects back to login page
    When I log in with valid credentials
    And I log out of my account
    Then I should see the login form fields
