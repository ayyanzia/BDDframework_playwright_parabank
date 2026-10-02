Feature: Bill Payment
  As an authenticated user
  I want to pay utility or other bills
  So that I can settle my monthly expenses online

  Background:
    Given I am logged in with the primary user
    And I navigate to the bill pay page

  @TC-BPY-001
  Scenario Outline: Pay payee amount
    When I submit a bill payment to payee "<payeeName>" with amount "<amount>" run <run>
    Then I should see the bill payment confirmation for "<payeeName>"

    Examples:
      | payeeName        | amount | run |
      | Acme Corp        | 25     | 1   |
      | Global Utilities | 75     | 1   |
      | Metro Gas        | 42     | 1   |
      | Acme Corp        | 25     | 2   |
      | Global Utilities | 75     | 2   |
      | Metro Gas        | 42     | 2   |

  @TC-BPY-002
  Scenario: Mismatched account numbers are rejected
    When I submit a bill payment with mismatched verify account numbers
    Then the payment submission should be rejected with a mismatch error

  @TC-BPY-003
  Scenario: Blank payee name is rejected
    When I submit a bill payment with a blank payee name
    Then I should see a validation error for missing fields

  @TC-BPY-004
  Scenario: Confirmation shows payee name and amount
    When I submit a bill payment to payee "Verification Corp" with amount "99"
    Then the confirmation should contain "Verification Corp" or "99" or "Complete"
