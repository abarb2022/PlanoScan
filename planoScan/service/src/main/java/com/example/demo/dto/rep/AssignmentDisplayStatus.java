package com.example.demo.dto.rep;

public enum AssignmentDisplayStatus {
  DUE_TODAY("Due today"),
  SUBMITTED("Submitted"),
  NEEDS_REVIEW("Needs review"),
  COMPLETED("Completed"),
  MISSED("Missed"),
  CANCELLED("Cancelled");

  private final String label;

  AssignmentDisplayStatus(String label) {
    this.label = label;
  }

  public String apiValue() {
    return name();
  }

  public static AssignmentDisplayStatus fromRequestValue(String value) {
    String normalizedValue = value == null ? "" : value.trim();
    if (normalizedValue.isBlank()) {
      return null;
    }
    String comparableValue = normalizedValue.toLowerCase().replace(' ', '_').replace('-', '_');

    for (AssignmentDisplayStatus status : values()) {
      String comparableLabel = status.label.toLowerCase().replace(' ', '_').replace('-', '_');
      if (status.name().equalsIgnoreCase(comparableValue)
          || comparableLabel.equals(comparableValue)) {
        return status;
      }
    }

    return null;
  }
}
