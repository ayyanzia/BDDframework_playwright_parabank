Feature: Find Transactions
  As an authenticated user
  I want to search for past transactions
  So that I can verify my payments and transfers

  Background:
    Given I am logged in with the primary user
    And I navigate to the find transactions page

  @TC-FTX-001
  Scenario Outline: Find transactions by amount
    When I search transactions by amount "<amount>"
    Then the transactions right panel should show results

    Examples:
      | amount |
      | 10     |
      | 50     |
      | 100    |

  @TC-FTX-002
  Scenario Outline: Find transactions by date
    When I search transactions by date "<date>"
    Then the transactions right panel should show results

    Examples:
      | date       |
      | 07-01-2026 |
      | 01-01-2026 |
      | 12-31-2025 |

  @TC-FTX-003
  Scenario: Find transactions by date range
    When I search transactions by date range from "01-01-2026" to "12-31-2026"
    Then the transactions right panel should show results

  @TC-FTX-004
  Scenario: Find by non-existent transaction ID shows no results
    When I search transactions by ID "99999999"
    Then the transactions right panel should show results

  @TC-FTX-005
  Scenario: Find Transactions without login shows error or redirect
    Given I navigate to the find transactions page with a clean session
    Then I should see an error or redirect to the home page
