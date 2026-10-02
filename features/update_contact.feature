Feature: Update Contact Info
  As an authenticated user
  I want to update my contact information
  So that the bank has my current address details

  Background:
    Given I am logged in with the primary user

  @TC-UCP-001
  Scenario Outline: Update profile address details
    When I update my contact profile with street "<street>" and city "<city>"
    Then the contact profile update confirmation should be displayed

    Examples:
      | street         | city       |
      | 111 First St   | City One   |
      | 222 Second Ave | City Two   |
      | 333 Third Blvd | City Three |

  @TC-UCP-002
  Scenario: Blank first name shows error or is rejected
    When I update my contact profile with an empty first name
    Then the system should reject the empty contact field

  @TC-UCP-003
  Scenario: Update Contact Info nav link opens profile form
    When I click the navigation link "Update Contact Info"
    Then I should see the contact profile form loaded

  @TC-UCP-004
  Scenario: Profile form has pre-populated fields
    When I navigate to the update contact page
    Then I should see the firstName and lastName fields are populated
