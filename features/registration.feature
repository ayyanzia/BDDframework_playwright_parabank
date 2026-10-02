Feature: User Registration
  As a new customer
  I want to register an account
  So that I can use online banking services

  Background:
    Given I navigate to the registration page

  @TC-REG-001
  Scenario: Submit empty form shows validation errors
    When I click the register button without entering details
    Then I should see validation errors on the form

  @TC-REG-002
  Scenario: Mismatched passwords show error
    When I enter user details with confirm password mismatched
    And I click the register button
    Then I should see validation errors on the form

  @TC-REG-003
  Scenario: Missing SSN shows error
    When I enter user details without SSN
    And I click the register button
    Then I should see validation errors on the form

  @TC-REG-004
  Scenario: Single-character first name is accepted
    When I register a user with first name "A"
    Then registration is accepted without crashes

  @TC-REG-005
  Scenario Outline: Successful registration with valid data
    When I register a new customer with valid data run <run>
    Then registration is accepted without crashes

    Examples:
      | run |
      | 1   |
      | 2   |
      | 3   |

  @TC-REG-006
  Scenario: Duplicate username is rejected
    When I attempt to register with a username that already exists
    Then the registration should fail or reject the duplicate username
