package com.example.demo.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
  STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "Store was not found"),
  COMPANY_NOT_FOUND(HttpStatus.NOT_FOUND, "Company was not found"),
  STORE_ALREADY_EXISTS(
      HttpStatus.BAD_REQUEST, "Store with this name already exists in the company"),
  USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User was not found"),
  EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "Email already registered"),
  INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "Invalid password"),
  UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "You are not authenticated. Please login first."),
  ACCESS_DENIED(HttpStatus.FORBIDDEN, "You do not have permission to access."),
  VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Invalid request"),
  INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong"),
  REP_NOT_FOUND(HttpStatus.NOT_FOUND, "Rep was not found"),
  ASSIGNMENT_RULE_NOT_FOUND(HttpStatus.NOT_FOUND, "Assignment rule was not found"),
  INVALID_CURRENT_PASSWORD(HttpStatus.UNAUTHORIZED, "Current password is incorrect"),
  REP_HAS_SUBMISSIONS(HttpStatus.CONFLICT, "Cannot delete rep with existing submissions"),
  DUPLICATE_ASSIGNMENT_RULE(
      HttpStatus.CONFLICT, "A rule for this store, rep and day already exists"),
  MANAGER_NOT_FOUND(HttpStatus.NOT_FOUND, "Manager was not found"),
  COMPANY_ALREADY_EXISTS(HttpStatus.CONFLICT, "A company with this name already exists"),
  ASSIGNMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "Assignment was not found"),
  ASSIGNMENT_ALREADY_SUBMITTED(HttpStatus.CONFLICT, "This assignment has already been submitted"),
  ASSIGNMENT_NOT_SUBMITTABLE(HttpStatus.CONFLICT, "This assignment is no longer accepting submissions"),
  COMPANY_HAS_DEPENDENTS(HttpStatus.CONFLICT, "Cannot delete company that has managers, reps, or stores"),
  PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "Product was not found"),
  PRODUCT_ALREADY_EXISTS(HttpStatus.CONFLICT, "A product with this name already exists in the company"),
  PLANOGRAM_NOT_FOUND(HttpStatus.NOT_FOUND, "Planogram was not found"),
  SUBMISSION_NOT_FOUND(HttpStatus.NOT_FOUND, "Submission was not found");

  private final HttpStatus status;
  private final String message;

  ErrorCode(HttpStatus status, String message) {
    this.status = status;
    this.message = message;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public String getMessage() {
    return message;
  }
}
