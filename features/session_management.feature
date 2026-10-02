Feature: Session Management
  As a customer
  I want my login session to be handled securely
  So that my account details remain protected

  @TC-SES-001
  Scenario: Session persists across navigation to overview
    Given I am logged in with the primary user
    When I navigate to the overview page URL directly
    Then the log out link should be visible

  @TC-SES-002
  Scenario: Session persists across navigation to bill pay
    Given I am logged in with the primary user
    When I navigate to the bill pay page URL directly
    Then the log out link should be visible

  @TC-SES-003
  Scenario: After logout, protected pages are inaccessible
    Given I am logged in with the primary user
    And I log out of my account
    When I navigate to the overview page URL directly
    Then I should see an error or redirect to the home page

  @TC-SES-004
  Scenario: Login form shown when unauthenticated
    Given I log out of my account
    When I navigate to the home page
    Then I should see the login form fields
