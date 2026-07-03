package com.example.demo.service;

import com.example.demo.dto.rep.AssignmentDisplayStatus;
import com.example.demo.dto.rep.RepAssignmentPageResponseDto;
import com.example.demo.dto.rep.RepAssignmentResponseDto;
import com.example.demo.dto.rep.RepAssignmentStoreDto;
import com.example.demo.dto.rep.RepSubmissionResponseDto;
import com.example.demo.entity.Score;
import com.example.demo.entity.StoreAssignment;
import com.example.demo.entity.Submission;
import com.example.demo.repository.StoreAssignmentRepository;
import com.example.demo.repository.StoreAssignmentSpecifications;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

@Service
@RequiredArgsConstructor
public class RepAssignmentService {

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM d");
  private static final DateTimeFormatter SUBMISSION_FORMATTER =
      DateTimeFormatter.ofPattern("MMM d, HH:mm");
  private static final int MAX_PAGE_SIZE = 100;

  private final StoreAssignmentRepository assignmentRepository;

  @Transactional(readOnly = true)
  public RepAssignmentPageResponseDto getAssignments(
      String repEmail, String tab, String date, String status, int page, int size) {
    LocalDate today = LocalDate.now();

    Specification<StoreAssignment> filter =
        Specification.allOf(
            StoreAssignmentSpecifications.assigneeEmail(repEmail),
            StoreAssignmentSpecifications.notCancelled(),
            StoreAssignmentSpecifications.matchesTab(tab),
            StoreAssignmentSpecifications.matchesDate(date, today),
            StoreAssignmentSpecifications.matchesStatus(status));

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
        .dueWindow("All day")
        .status(deriveStatus(assignment).apiValue())
        .planogram(
            latestSubmission == null ? "No submission yet" : latestSubmission.getPlanogram().getName())
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
      case COMPLETED ->
          hasScoredSubmission(assignment)
              ? AssignmentDisplayStatus.NEEDS_REVIEW
              : AssignmentDisplayStatus.SUBMITTED;
      case CANCELLED -> AssignmentDisplayStatus.CANCELLED;
    };
  }

  private boolean hasScoredSubmission(StoreAssignment assignment) {
    return sortedSubmissions(assignment).stream()
        .anyMatch(submission -> submission.getStatus().equals(Submission.Status.SCORED));
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
