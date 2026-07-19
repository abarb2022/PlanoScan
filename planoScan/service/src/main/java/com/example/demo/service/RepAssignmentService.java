package com.example.demo.service;

import com.example.demo.dto.rep.AssignmentDisplayStatus;
import com.example.demo.dto.rep.RepAssignmentPageResponseDto;
import com.example.demo.dto.rep.RepAssignmentResponseDto;
import com.example.demo.dto.rep.RepAssignmentStoreDto;
import com.example.demo.dto.rep.RepSubmissionResponseDto;
import com.example.demo.dto.rep.RepUpcomingAssignmentDto;
import com.example.demo.entity.Planogram;
import com.example.demo.entity.Score;
import com.example.demo.entity.StoreAssignment;
import com.example.demo.entity.StoreAssignmentRule;
import com.example.demo.entity.Submission;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class RepAssignmentService {

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM d");
  private static final DateTimeFormatter SUBMISSION_FORMATTER =
      DateTimeFormatter.ofPattern("MMM d, HH:mm");
  private static final int MAX_PAGE_SIZE = 100;

  private final StoreAssignmentRepository assignmentRepository;
  private final StoreAssignmentRuleRepository assignmentRuleRepository;
  private final PlanogramRepository planogramRepository;
  private final PlanogramAssignmentRepository planogramAssignmentRepository;
  private final SubmissionRepository submissionRepository;
  private final UserRepository userRepository;
  private final PhotoStorage photoStorage;

  @Transactional(readOnly = true)
  public RepAssignmentPageResponseDto getAssignments(
      String repEmail, String tab, String date, String status, String storeName, int page, int size) {
    LocalDate today = LocalDate.now();

    Specification<StoreAssignment> filter =
        Specification.allOf(
            StoreAssignmentSpecifications.assigneeEmail(repEmail),
            StoreAssignmentSpecifications.notCancelled(),
            StoreAssignmentSpecifications.matchesTab(tab, today),
            StoreAssignmentSpecifications.matchesDate(date, today),
            StoreAssignmentSpecifications.matchesStatus(status),
            StoreAssignmentSpecifications.storeNameContains(storeName));

    Pageable pageable =
        PageRequest.of(
            Math.max(0, page),
            Math.max(1, Math.min(size, MAX_PAGE_SIZE)),
            Sort.by(Sort.Direction.DESC, "assignmentDate", "createdAt"));

    Page<StoreAssignment> matchingPage = assignmentRepository.findAll(filter, pageable);
    List<UUID> pageIds = matchingPage.getContent().stream().map(StoreAssignment::getId).toList();
    Map<UUID, StoreAssignment> loaded =
        assignmentRepository.findByIdIn(pageIds).stream()
            .collect(Collectors.toMap(StoreAssignment::getId, Function.identity()));

    List<RepAssignmentResponseDto> content =
        pageIds.stream().map(loaded::get).map(assignment -> toDto(assignment, today)).toList();

    return new RepAssignmentPageResponseDto(
        content, matchingPage.getTotalPages(), matchingPage.getTotalElements(), matchingPage.getNumber());
  }

  /**
   * Projects future visits directly from the rep's recurring {@link StoreAssignmentRule}s, since
   * concrete {@link StoreAssignment} rows are only ever generated just-in-time for the current
   * day — no real rows exist yet for future dates to query. Only strictly-future dates are
   * returned; today and the past are covered by the "active"/"history" tabs instead, where actual
   * outcomes (missed, cancelled, submitted) are known.
   */
  @Transactional(readOnly = true)
  public List<RepUpcomingAssignmentDto> getUpcomingAssignments(
      String repEmail, LocalDate from, LocalDate to) {
    User rep =
        userRepository
            .findByEmail(repEmail)
            .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));

    LocalDate today = LocalDate.now();
    LocalDate rangeStart = from.isAfter(today) ? from : today.plusDays(1);
    if (rangeStart.isAfter(to)) {
      return List.of();
    }

    List<StoreAssignmentRule> rules = assignmentRuleRepository.findByAssigneeId(rep.getId());

    List<RepUpcomingAssignmentDto> occurrences = new ArrayList<>();
    for (StoreAssignmentRule rule : rules) {
      LocalDate windowStart =
          rule.getValidFrom().isAfter(rangeStart) ? rule.getValidFrom() : rangeStart;
      LocalDate windowEnd =
          rule.getValidUntil() != null && rule.getValidUntil().isBefore(to)
              ? rule.getValidUntil()
              : to;
      if (windowStart.isAfter(windowEnd)) {
        continue;
      }

      RepAssignmentStoreDto storeDto =
          RepAssignmentStoreDto.builder()
              .id(rule.getStore().getId())
              .name(rule.getStore().getName())
              .address(rule.getStore().getAddress())
              .companyName(rule.getStore().getCompany().getName())
              .build();

      LocalDate occurrence = windowStart.with(TemporalAdjusters.nextOrSame(rule.getDayOfWeek()));
      while (!occurrence.isAfter(windowEnd)) {
        occurrences.add(
            RepUpcomingAssignmentDto.builder().date(occurrence.toString()).store(storeDto).build());
        occurrence = occurrence.plusWeeks(1);
      }
    }

    return occurrences.stream().sorted(Comparator.comparing(RepUpcomingAssignmentDto::getDate)).toList();
  }

  @Transactional
  public RepAssignmentResponseDto createSubmission(
      String repEmail, UUID assignmentId, List<MultipartFile> photos) {
    if (photos == null || photos.isEmpty()) {
      throw new ServerException(ErrorCode.VALIDATION_ERROR);
    }

    StoreAssignment assignment =
        assignmentRepository
            .findById(assignmentId)
            .orElseThrow(() -> new ServerException(ErrorCode.ASSIGNMENT_NOT_FOUND));

    if (!assignment.getAssignee().getEmail().equalsIgnoreCase(repEmail)) {
      throw new ServerException(ErrorCode.ACCESS_DENIED);
    }

    if (assignment.getStatus() == StoreAssignment.Status.COMPLETED) {
      throw new ServerException(ErrorCode.ASSIGNMENT_ALREADY_SUBMITTED);
    }

    if (assignment.getStatus() != StoreAssignment.Status.ASSIGNED) {
      throw new ServerException(ErrorCode.ASSIGNMENT_NOT_SUBMITTABLE);
    }

    LocalDate today = LocalDate.now();

    // Find the store's active planogram (manager-uploaded). If none exists, submissions
    // are still created but will not be scored until a planogram is assigned.
    Planogram activePlanogram =
        planogramAssignmentRepository
            .findActiveByStoreId(assignment.getStore().getId(), today)
            .stream()
            .findFirst()
            .map(pa -> pa.getPlanogram())
            .orElse(null);

    List<Submission> submissions = new ArrayList<>();
    for (MultipartFile photo : photos) {
      String photoUrl = photoStorage.store(photo, "submissions");
      submissions.add(
          Submission.builder()
              .rep(assignment.getAssignee())
              .store(assignment.getStore())
              .planogram(activePlanogram)
              .assignment(assignment)
              .photoUrl(photoUrl)
              .build());
    }
    submissionRepository.saveAll(submissions);

    assignment.setStatus(StoreAssignment.Status.COMPLETED);
    StoreAssignment saved = assignmentRepository.save(assignment);

    return toDto(assignmentRepository.findByIdIn(List.of(saved.getId())).get(0), today);
  }

  private RepAssignmentResponseDto toDto(StoreAssignment assignment, LocalDate today) {
    List<Submission> sortedSubmissions = sortedSubmissions(assignment);
    Submission latestSubmission = sortedSubmissions.isEmpty() ? null : sortedSubmissions.get(0);

    return RepAssignmentResponseDto.builder()
        .id(assignment.getId())
        .store(
            RepAssignmentStoreDto.builder()
                .id(assignment.getStore().getId())
                .name(assignment.getStore().getName())
                .address(assignment.getStore().getAddress())
                .companyName(assignment.getStore().getCompany().getName())
                .build())
        .assignmentDate(formatAssignmentDate(assignment.getAssignmentDate(), today))
        .status(deriveStatus(assignment).apiValue())
        .lastSubmittedAt(
            latestSubmission == null
                ? null
                : formatSubmissionDate(latestSubmission.getSubmittedAt(), today))
        .submissions(
            sortedSubmissions.stream()
                .map(submission -> toSubmissionDto(submission, today))
                .toList())
        .build();
  }

  private RepSubmissionResponseDto toSubmissionDto(Submission submission, LocalDate today) {
    return RepSubmissionResponseDto.builder()
        .id(submission.getId())
        .submittedAt(formatSubmissionDate(submission.getSubmittedAt(), today))
        .status(formatSubmissionStatus(submission.getStatus()))
        .score(formatScore(submission.getScore()))
        .photoName(photoName(submission.getPhotoUrl()))
        .photoUrl(submission.getPhotoUrl())
        .planogramName(
            submission.getPlanogram() == null ? null : submission.getPlanogram().getName())
        .build();
  }

  private List<Submission> sortedSubmissions(StoreAssignment assignment) {
    if (assignment.getSubmissions() == null) {
      return List.of();
    }

    return assignment.getSubmissions().stream()
        .sorted(
            Comparator.comparing(
                    Submission::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .reversed())
        .toList();
  }

  private AssignmentDisplayStatus deriveStatus(StoreAssignment assignment) {
    return switch (assignment.getStatus()) {
      case ASSIGNED -> AssignmentDisplayStatus.DUE_TODAY;
      case MISSED -> AssignmentDisplayStatus.MISSED;
      case COMPLETED -> {
        List<Submission> subs = sortedSubmissions(assignment);
        boolean anyScored   = subs.stream().anyMatch(s -> s.getStatus() == Submission.Status.SCORED);
        boolean anyReviewed = subs.stream().anyMatch(s -> s.getStatus() == Submission.Status.REVIEWED);
        // SCORED means flagged and waiting for manager action → highest priority
        if (anyScored)   yield AssignmentDisplayStatus.NEEDS_REVIEW;
        if (anyReviewed) yield AssignmentDisplayStatus.COMPLETED;
        yield AssignmentDisplayStatus.SUBMITTED;
      }
      case CANCELLED -> AssignmentDisplayStatus.CANCELLED;
    };
  }

  private String formatAssignmentDate(LocalDate date, LocalDate today) {
    if (date.isEqual(today)) {
      return "Today";
    }
    if (date.isEqual(today.minusDays(1))) {
      return "Yesterday";
    }
    return date.format(DATE_FORMATTER);
  }

  private String formatSubmissionDate(LocalDateTime submittedAt, LocalDate today) {
    if (submittedAt == null) {
      return "";
    }

    LocalDate submittedDate = submittedAt.toLocalDate();
    String time = submittedAt.format(DateTimeFormatter.ofPattern("HH:mm"));
    if (submittedDate.isEqual(today)) {
      return "Today, " + time;
    }
    if (submittedDate.isEqual(today.minusDays(1))) {
      return "Yesterday, " + time;
    }
    return submittedAt.format(SUBMISSION_FORMATTER);
  }

  private String formatSubmissionStatus(Submission.Status status) {
    String value = status.name().toLowerCase().replace('_', ' ');
    return Character.toUpperCase(value.charAt(0)) + value.substring(1);
  }

  private String formatScore(Score score) {
    if (score == null || score.getOverallScore() == null) {
      return null;
    }

    float value = score.getOverallScore();
    float percentage = value <= 1 ? value * 100 : value;
    return Math.round(percentage) + "%";
  }

  private String photoName(String photoUrl) {
    if (photoUrl == null || photoUrl.isBlank()) {
      return "Photo";
    }

    int lastSlash = photoUrl.lastIndexOf('/');
    return lastSlash >= 0 ? photoUrl.substring(lastSlash + 1) : photoUrl;
  }
}
