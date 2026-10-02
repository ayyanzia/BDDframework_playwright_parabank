Feature: Request Loan
  As an authenticated user
  I want to request a loan
  So that I can borrow money from the bank

  Background:
    Given I am logged in with the primary user

  @TC-LNS-001
  Scenario Outline: Loan application
    When I request a loan with amount "<amount>" and down payment "<downPayment>" run <run>
    Then the loan request result should show status or confirmation

    Examples:
      | amount | downPayment | run |
      | 1000   | 100         | 1   |
      | 5000   | 500         | 1   |
      | 500    | 50          | 1   |
      | 1000   | 100         | 2   |
      | 5000   | 500         | 2   |
      | 500    | 50          | 2   |

  @TC-LNS-002
  Scenario: Loan page renders Amount, Down Payment and Apply button
    When I navigate to the request loan page
    Then I should see the loan form input fields and apply button

  @TC-LNS-003
  Scenario: Blank loan amount handled gracefully
    When I submit a loan application with blank fields
    Then the page should handle the empty request without internal server error

  @TC-LNS-004
  Scenario: Very large loan amount edge case ($999999)
    When I request a loan with amount "999999" and down payment "10000"
    Then the page should handle the empty request without internal server error
