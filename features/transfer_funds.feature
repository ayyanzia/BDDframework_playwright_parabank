Feature: Transfer Funds
  As an authenticated user
  I want to transfer funds between my accounts
  So that I can move money where I need it

  Background:
    Given I am logged in with the primary user

  @TC-TRF-001
  Scenario Outline: Transfer between accounts
    When I transfer an amount of "<amount>" between my accounts
    Then I should see the transfer complete confirmation page

    Examples:
      | amount |
      | 10     |
      | 50     |
      | 100    |

  @TC-TRF-002
  Scenario: Transfer page shows From and To dropdowns
    When I navigate to the transfer page
    Then I should see the transfer from and transfer to account dropdowns

  @TC-TRF-003
  Scenario: Transfer with blank amount does not crash server
    When I submit a transfer with a blank amount
    Then the server should handle it gracefully without internal error

  @TC-TRF-004
  Scenario: Transfer with zero amount is handled
    When I transfer an amount of "0" between my accounts
    Then the transfer should be processed or handled without crashes
