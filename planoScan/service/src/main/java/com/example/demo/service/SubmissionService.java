package com.example.demo.service;

import com.example.demo.dto.submission.SubmissionDetailDto;
import com.example.demo.dto.submission.SubmissionPageResponseDto;
import com.example.demo.dto.submission.SubmissionSummaryDto;
import com.example.demo.entity.Score;
import com.example.demo.entity.Submission;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.SubmissionRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.StarRating;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SubmissionService {

  private static final DateTimeFormatter DT_FMT =
      DateTimeFormatter.ofPattern("MMM d, yyyy HH:mm");

  private final SubmissionRepository submissionRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public SubmissionPageResponseDto getSubmissions(
      int page,
      int size,
      UUID requestedCompanyId,
      UUID storeId,
      UUID repId,
      Integer stars,
      String callerEmail) {
    User caller = getUser(callerEmail);
    UUID companyId =
        caller.getRole() == User.Role.ADMIN ? requestedCompanyId : caller.getCompany().getId();

    if (stars != null && (stars < 0 || stars > 5)) {
      throw new ServerException(ErrorCode.VALIDATION_ERROR);
    }
    Float minScore = stars != null ? StarRating.minScoreForStars(stars) : null;
    Float maxScore = stars != null ? StarRating.maxScoreForStars(stars) : null;

    Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
    Page<Submission> result =
        submissionRepository.findScored(companyId, storeId, repId, minScore, maxScore, pageable);

    return new SubmissionPageResponseDto(
        result.getContent().stream().map(this::toSummaryDto).toList(),
        result.getTotalPages(),
        result.getTotalElements(),
        result.getNumber());
  }

  @Transactional(readOnly = true)
  public SubmissionDetailDto getSubmissionDetail(UUID submissionId, String callerEmail) {
    User caller = getUser(callerEmail);
    Submission submission =
        submissionRepository
            .findDetailById(submissionId)
            .orElseThrow(() -> new ServerException(ErrorCode.SUBMISSION_NOT_FOUND));

    if (caller.getRole() != User.Role.ADMIN
        && !submission.getStore().getCompany().getId().equals(caller.getCompany().getId())) {
      throw new ServerException(ErrorCode.ACCESS_DENIED);
    }
    if (submission.getScore() == null) {
      throw new ServerException(ErrorCode.SUBMISSION_NOT_FOUND);
    }

    return toDetailDto(submission);
  }

  private SubmissionSummaryDto toSummaryDto(Submission s) {
    Score score = s.getScore();
    float overall = score != null && score.getOverallScore() != null ? score.getOverallScore() : 0f;
    return SubmissionSummaryDto.builder()
        .id(s.getId())
        .repId(s.getRep().getId())
        .repName(s.getRep().getName())
        .storeId(s.getStore().getId())
        .storeName(s.getStore().getName())
        .planogramName(s.getPlanogram() != null ? s.getPlanogram().getName() : null)
        .photoUrl(s.getPhotoUrl())
        .overallScore(overall)
        .stars(StarRating.fromScore(overall))
        .status(s.getStatus().name())
        .flaggedForReview(s.isFlaggedForReview())
        .submittedAt(s.getSubmittedAt() != null ? s.getSubmittedAt().format(DT_FMT) : null)
        .build();
  }

  private SubmissionDetailDto toDetailDto(Submission s) {
    Score score = s.getScore();
    float overall = score != null && score.getOverallScore() != null ? score.getOverallScore() : 0f;
    return SubmissionDetailDto.builder()
        .id(s.getId())
        .repName(s.getRep().getName())
        .repEmail(s.getRep().getEmail())
        .storeId(s.getStore().getId())
        .storeName(s.getStore().getName())
        .storeAddress(s.getStore().getAddress())
        .assignmentDate(
            s.getAssignment() != null && s.getAssignment().getAssignmentDate() != null
                ? s.getAssignment().getAssignmentDate().toString()
                : null)
        .submittedAt(s.getSubmittedAt() != null ? s.getSubmittedAt().format(DT_FMT) : null)
        .photoUrl(s.getPhotoUrl())
        .planogramName(s.getPlanogram() != null ? s.getPlanogram().getName() : null)
        .overallScore(overall)
        .stars(StarRating.fromScore(overall))
        .status(s.getStatus().name())
        .flaggedForReview(s.isFlaggedForReview())
        .scoreDetail(score != null ? score.getDetailFlags() : null)
        .build();
  }

  private User getUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));
  }
}
