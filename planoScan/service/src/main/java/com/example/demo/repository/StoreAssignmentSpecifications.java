package com.example.demo.repository;

import com.example.demo.dto.rep.AssignmentDisplayStatus;
import com.example.demo.entity.StoreAssignment;
import com.example.demo.entity.Submission;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public final class StoreAssignmentSpecifications {

  private StoreAssignmentSpecifications() {}

  public static Specification<StoreAssignment> assigneeEmail(String email) {
    return (root, query, cb) -> cb.equal(root.get("assignee").get("email"), email);
  }

  public static Specification<StoreAssignment> notCancelled() {
    return (root, query, cb) -> cb.notEqual(root.get("status"), StoreAssignment.Status.CANCELLED);
  }

  public static Specification<StoreAssignment> matchesTab(String tab) {
    if ("history".equals(normalize(tab))) {
      return (root, query, cb) ->
          cb.or(isMissed(root, cb), isCompletedWithScoredSubmission(root, query, cb));
    }
    return (root, query, cb) ->
        cb.or(isDueToday(root, cb), isCompletedWithoutScoredSubmission(root, query, cb));
  }

  public static Specification<StoreAssignment> matchesDate(String date, LocalDate today) {
    return switch (normalize(date)) {
      case "today" ->
          (root, query, cb) -> cb.equal(root.get("assignmentDate"), today);
      case "yesterday" ->
          (root, query, cb) -> cb.equal(root.get("assignmentDate"), today.minusDays(1));
      case "older" ->
          (root, query, cb) -> cb.lessThan(root.get("assignmentDate"), today.minusDays(1));
      default -> (root, query, cb) -> cb.conjunction();
    };
  }

  public static Specification<StoreAssignment> matchesStatus(String status) {
    String normalizedStatus = normalize(status);
    if (normalizedStatus.isBlank() || "all".equals(normalizedStatus)) {
      return (root, query, cb) -> cb.conjunction();
    }

    AssignmentDisplayStatus selectedStatus = AssignmentDisplayStatus.fromRequestValue(status);
    if (selectedStatus == null) {
      return (root, query, cb) -> cb.disjunction();
    }

    return switch (selectedStatus) {
      case DUE_TODAY -> (root, query, cb) -> isDueToday(root, cb);
      case SUBMITTED ->
          (root, query, cb) -> isCompletedWithoutScoredSubmission(root, query, cb);
      case NEEDS_REVIEW ->
          (root, query, cb) -> isCompletedWithScoredSubmission(root, query, cb);
      case MISSED -> (root, query, cb) -> isMissed(root, cb);
      case CANCELLED ->
          (root, query, cb) -> cb.equal(root.get("status"), StoreAssignment.Status.CANCELLED);
    };
  }

  private static Predicate isDueToday(Root<StoreAssignment> root, CriteriaBuilder cb) {
    return cb.equal(root.get("status"), StoreAssignment.Status.ASSIGNED);
  }

  private static Predicate isMissed(Root<StoreAssignment> root, CriteriaBuilder cb) {
    return cb.equal(root.get("status"), StoreAssignment.Status.MISSED);
  }

  private static Predicate isCompletedWithScoredSubmission(
      Root<StoreAssignment> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
    return cb.and(
        cb.equal(root.get("status"), StoreAssignment.Status.COMPLETED),
        hasScoredSubmission(root, query, cb));
  }

  private static Predicate isCompletedWithoutScoredSubmission(
      Root<StoreAssignment> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
    return cb.and(
        cb.equal(root.get("status"), StoreAssignment.Status.COMPLETED),
        cb.not(hasScoredSubmission(root, query, cb)));
  }

  private static Predicate hasScoredSubmission(
      Root<StoreAssignment> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
    Subquery<Long> subquery = query.subquery(Long.class);
    Root<Submission> submission = subquery.from(Submission.class);
    subquery
        .select(cb.literal(1L))
        .where(
            cb.equal(submission.get("assignment"), root),
            cb.equal(submission.get("status"), Submission.Status.SCORED));

    return cb.exists(subquery);
  }

  private static String normalize(String value) {
    return value == null ? "" : value.trim().toLowerCase().replace(' ', '-');
  }
}
