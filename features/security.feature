Feature: Security & Input Validation
  As an application security engineer
  I want to verify the application handles common security inputs and access control rules
  So that customer data is safe from manipulation and unauthorized access

  @TC-SEC-001
  Scenario: SQL injection in login username does not crash server
    Given I navigate to the home page with a clean session
    When I submit login with SQL injection inputs
    Then the server should reject the login without java or database stack traces

  @TC-SEC-002
  Scenario: XSS script tag in first name is not executed
    Given I navigate to the registration page
    When I submit registration with XSS script in first name
    Then no javascript alert dialog should trigger during registration

  @TC-SEC-003
  Scenario: Very long username (255 chars) does not crash
    Given I navigate to the registration page
    When I submit registration with a 255 character long username
    Then the server should reject or handle it without crashing

  @TC-SEC-004
  Scenario: Empty SSN is rejected by registration form
    Given I navigate to the registration page
    When I submit registration details with empty SSN
    Then I should see validation errors on the form

  @TC-SEC-005
  Scenario: Find Transactions without login shows error or redirect
    Given I navigate to the find transactions page with a clean session
    Then I should see an error or redirect to the home page

  @TC-SEC-006
  Scenario: Request Loan without login shows error or redirect
    Given I navigate to the request loan page with a clean session
    Then I should see an error or redirect to the home page

  @TC-SEC-007
  Scenario: Update Contact without login shows error or redirect
    Given I navigate to the update contact page with a clean session
    Then I should see an error or redirect to the home page
