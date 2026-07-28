package com.example.demo.service;

import com.example.demo.dto.dashboard.DashboardDayDto;
import com.example.demo.dto.dashboard.DashboardPhotoDto;
import com.example.demo.dto.dashboard.DashboardTotalsDto;
import com.example.demo.dto.dashboard.DashboardVisitDto;
import com.example.demo.dto.dashboard.DashboardVisitStatus;
import com.example.demo.dto.dashboard.ManagerDashboardResponseDto;
import com.example.demo.dto.dashboard.ManagerRepWeekDetailDto;
import com.example.demo.dto.dashboard.RepWeeklyStatsDto;
import com.example.demo.entity.Store;
import com.example.demo.entity.StoreAssignment;
import com.example.demo.entity.StoreAssignmentRule;
import com.example.demo.entity.Submission;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.StoreAssignmentRepository;
import com.example.demo.repository.StoreAssignmentRuleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.StarRating;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagerDashboardService {

  private static final DateTimeFormatter DAY_LABEL_FORMATTER =
      DateTimeFormatter.ofPattern("EEE, MMM d");
  private static final DateTimeFormatter PHOTO_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
  private static final int MAX_REPS = 1000;

  private final UserRepository userRepository;
  private final StoreAssignmentRuleRepository ruleRepository;
  private final StoreAssignmentRepository assignmentRepository;

  @Transactional(readOnly = true)
  public ManagerDashboardResponseDto getWeeklyOverview(
      LocalDate weekStart, UUID companyId, String currentUserEmail) {
    User currentUser = getCurrentUser(currentUserEmail);
    LocalDate monday = weekStart.with(DayOfWeek.MONDAY);
    LocalDate sunday = monday.plusDays(6);

    List<User> reps = resolveReps(currentUser, companyId);
    List<VisitRecord> records = buildWeekVisits(reps, monday, sunday);
    Map<UUID, List<VisitRecord>> recordsByRep =
        records.stream().collect(Collectors.groupingBy(VisitRecord::repId));

    List<RepWeeklyStatsDto> repStats =
        reps.stream()
            .map(
                rep -> {
                  DashboardTotalsDto totals =
                      summarizeRecords(recordsByRep.getOrDefault(rep.getId(), List.of()));
                  return RepWeeklyStatsDto.builder()
                      .repId(rep.getId())
                      .repName(rep.getName())
                      .repEmail(rep.getEmail())
                      .totals(totals)
                      .completionRate(completionRate(totals))
                      .build();
                })
            .toList();

    DashboardTotalsDto companyTotals = summarizeRecords(records);

    return ManagerDashboardResponseDto.builder()
        .weekStart(monday.toString())
        .weekEnd(sunday.toString())
        .companyTotals(companyTotals)
        .reps(repStats)
        .build();
  }

  @Transactional(readOnly = true)
  public ManagerRepWeekDetailDto getRepWeekDetail(
      UUID repId, LocalDate weekStart, String currentUserEmail) {
    User currentUser = getCurrentUser(currentUserEmail);
    User rep =
        userRepository
            .findById(repId)
            .filter(u -> u.getRole() == User.Role.REP)
            .orElseThrow(() -> new ServerException(ErrorCode.REP_NOT_FOUND));

    if (currentUser.getRole() != User.Role.ADMIN
        && !rep.getCompany().getId().equals(requireOwnCompanyId(currentUser))) {
      throw new ServerException(ErrorCode.ACCESS_DENIED);
    }

    LocalDate monday = weekStart.with(DayOfWeek.MONDAY);
    LocalDate sunday = monday.plusDays(6);

    List<VisitRecord> records = buildWeekVisits(List.of(rep), monday, sunday);
    Map<LocalDate, List<VisitRecord>> byDate =
        records.stream().collect(Collectors.groupingBy(VisitRecord::date));

    List<DashboardDayDto> days = new ArrayList<>();
    for (LocalDate d = monday; !d.isAfter(sunday); d = d.plusDays(1)) {
      List<DashboardVisitDto> visits =
          byDate.getOrDefault(d, List.of()).stream()
              .map(VisitRecord::visit)
              .sorted(Comparator.comparing(DashboardVisitDto::getStoreName))
              .toList();
      days.add(
          DashboardDayDto.builder()
              .date(d.toString())
              .dayLabel(d.format(DAY_LABEL_FORMATTER))
              .visits(visits)
              .build());
    }

    return ManagerRepWeekDetailDto.builder()
        .repId(rep.getId())
        .repName(rep.getName())
        .repEmail(rep.getEmail())
        .weekStart(monday.toString())
        .weekEnd(sunday.toString())
        .totals(summarizeRecords(records))
        .days(days)
        .build();
  }

  /**
   * Concrete {@link StoreAssignment} rows only exist for days a rep has already opened their app
   * on (see {@code AssignmentGenerationService.ensureTodaysAssignments}) — future dates, and past
   * dates the rep never opened the app on, have no row at all. So expected visits are projected
   * from the recurring {@link StoreAssignmentRule}s for every day of the week, then overlaid with
   * whatever real assignment/submission/score data exists. Ad-hoc assignments (no rule) are added
   * directly since they have no rule to project from.
   */
  private List<VisitRecord> buildWeekVisits(List<User> reps, LocalDate monday, LocalDate sunday) {
    List<UUID> repIds = reps.stream().map(User::getId).toList();
    if (repIds.isEmpty()) {
      return List.of();
    }

    List<StoreAssignmentRule> rules = ruleRepository.findByAssigneeIdIn(repIds);
    List<StoreAssignment> actual =
        assignmentRepository.findByAssignee_IdInAndAssignmentDateBetween(repIds, monday, sunday);

    Map<RuleDateKey, StoreAssignment> byRuleDate =
        actual.stream()
            .filter(a -> a.getRule() != null)
            .collect(
                Collectors.toMap(
                    a -> new RuleDateKey(a.getRule().getId(), a.getAssignmentDate()),
                    Function.identity(),
                    (a, b) -> a));
    List<StoreAssignment> adHoc = actual.stream().filter(a -> a.getRule() == null).toList();

    LocalDate today = LocalDate.now();
    List<VisitRecord> records = new ArrayList<>();

    for (LocalDate d = monday; !d.isAfter(sunday); d = d.plusDays(1)) {
      DayOfWeek dow = d.getDayOfWeek();
      LocalDate date = d;
      for (StoreAssignmentRule rule : rules) {
        if (rule.getDayOfWeek() != dow) continue;
        if (rule.getValidFrom().isAfter(date)) continue;
        if (rule.getValidUntil() != null && rule.getValidUntil().isBefore(date)) continue;

        StoreAssignment row = byRuleDate.get(new RuleDateKey(rule.getId(), date));
        DashboardVisitStatus status = deriveStatus(row, date, today);
        records.add(
            new VisitRecord(rule.getAssignee().getId(), date, toVisitDto(rule.getStore(), row, status)));
      }
    }

    for (StoreAssignment row : adHoc) {
      DashboardVisitStatus status = deriveStatus(row, row.getAssignmentDate(), today);
      records.add(
          new VisitRecord(
              row.getAssignee().getId(), row.getAssignmentDate(), toVisitDto(row.getStore(), row, status)));
    }

    return records;
  }

  private DashboardVisitStatus deriveStatus(StoreAssignment row, LocalDate date, LocalDate today) {
    if (row == null) {
      if (date.isAfter(today)) return DashboardVisitStatus.PLANNED;
      if (date.isEqual(today)) return DashboardVisitStatus.DUE_TODAY;
      return DashboardVisitStatus.MISSED;
    }

    return switch (row.getStatus()) {
      case CANCELLED -> DashboardVisitStatus.CANCELLED;
      case MISSED -> DashboardVisitStatus.MISSED;
      case COMPLETED -> deriveCompletedStatus(row);
      case ASSIGNED -> {
        if (date.isAfter(today)) yield DashboardVisitStatus.PLANNED;
        if (date.isEqual(today)) yield DashboardVisitStatus.DUE_TODAY;
        yield DashboardVisitStatus.MISSED;
      }
    };
  }

  private DashboardVisitStatus deriveCompletedStatus(StoreAssignment row) {
    List<Submission> submissions = row.getSubmissions() == null ? List.of() : row.getSubmissions();
    boolean anyScored = submissions.stream().anyMatch(s -> s.getStatus() == Submission.Status.SCORED);
    boolean anyReviewed =
        submissions.stream().anyMatch(s -> s.getStatus() == Submission.Status.REVIEWED);
    if (anyScored) return DashboardVisitStatus.NEEDS_REVIEW;
    if (anyReviewed) return DashboardVisitStatus.COMPLETED;
    return DashboardVisitStatus.SUBMITTED;
  }

  private DashboardVisitDto toVisitDto(Store store, StoreAssignment row, DashboardVisitStatus status) {
    Submission latest = latestScoredSubmission(row);
    Float score = latest == null || latest.getScore() == null ? null : latest.getScore().getOverallScore();
    Integer stars = score == null ? null : StarRating.fromScore(score);

    return DashboardVisitDto.builder()
        .storeId(store.getId())
        .storeName(store.getName())
        .storeAddress(store.getAddress())
        .status(status)
        .score(score)
        .stars(stars)
        .photos(toPhotoDtos(row))
        .build();
  }

  private Submission latestScoredSubmission(StoreAssignment row) {
    if (row == null || row.getSubmissions() == null) {
      return null;
    }
    return row.getSubmissions().stream()
        .filter(s -> s.getScore() != null)
        .max(Comparator.comparing(Submission::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder())))
        .orElse(null);
  }

  private List<DashboardPhotoDto> toPhotoDtos(StoreAssignment row) {
    if (row == null || row.getSubmissions() == null) {
      return List.of();
    }
    return row.getSubmissions().stream()
        .sorted(Comparator.comparing(Submission::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder())))
        .map(
            s ->
                DashboardPhotoDto.builder()
                    .submissionId(s.getId())
                    .photoUrl(s.getPhotoUrl())
                    .submittedAt(s.getSubmittedAt() == null ? null : s.getSubmittedAt().format(PHOTO_TIME_FORMATTER))
                    .build())
        .toList();
  }

  private DashboardTotalsDto summarizeRecords(List<VisitRecord> records) {
    return summarizeVisits(records.stream().map(VisitRecord::visit).toList());
  }

  private DashboardTotalsDto summarizeVisits(List<DashboardVisitDto> visits) {
    int planned = 0;
    int submitted = 0;
    int missed = 0;
    int graded = 0;
    int needsReview = 0;
    double scoreSum = 0;
    int scoreCount = 0;

    for (DashboardVisitDto visit : visits) {
      if (visit.getStatus() == DashboardVisitStatus.CANCELLED) continue;
      planned++;

      switch (visit.getStatus()) {
        case SUBMITTED, NEEDS_REVIEW, COMPLETED -> submitted++;
        case MISSED -> missed++;
        default -> {}
      }

      if (visit.getStatus() == DashboardVisitStatus.NEEDS_REVIEW
          || visit.getStatus() == DashboardVisitStatus.COMPLETED) {
        graded++;
      }
      if (visit.getStatus() == DashboardVisitStatus.NEEDS_REVIEW) {
        needsReview++;
      }
      if (visit.getScore() != null) {
        scoreSum += visit.getScore();
        scoreCount++;
      }
    }

    Float avgScore = scoreCount == 0 ? null : (float) (scoreSum / scoreCount);

    return DashboardTotalsDto.builder()
        .outletsPlanned(planned)
        .outletsSubmitted(submitted)
        .outletsMissed(missed)
        .outletsGraded(graded)
        .needsReview(needsReview)
        .avgScore(avgScore)
        .build();
  }

  private Float completionRate(DashboardTotalsDto totals) {
    if (totals.getOutletsPlanned() == 0) {
      return null;
    }
    return (float) totals.getOutletsSubmitted() / totals.getOutletsPlanned();
  }

  private List<User> resolveReps(User currentUser, UUID companyId) {
    Pageable pageable = PageRequest.of(0, MAX_REPS, Sort.by("name"));
    if (currentUser.getRole() == User.Role.ADMIN) {
      return companyId != null
          ? userRepository.findByCompanyIdAndRole(companyId, User.Role.REP, pageable).getContent()
          : userRepository.findByRole(User.Role.REP, pageable).getContent();
    }
    return userRepository
        .findByCompanyIdAndRole(requireOwnCompanyId(currentUser), User.Role.REP, pageable)
        .getContent();
  }

  private User getCurrentUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));
  }

  private UUID requireOwnCompanyId(User user) {
    if (user.getCompany() == null) {
      throw new ServerException(ErrorCode.COMPANY_NOT_FOUND);
    }
    return user.getCompany().getId();
  }

  private record RuleDateKey(UUID ruleId, LocalDate date) {}

  private record VisitRecord(UUID repId, LocalDate date, DashboardVisitDto visit) {}
}
