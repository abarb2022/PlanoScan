package com.example.demo.service;

import com.example.demo.dto.review.FlaggedSubmissionDto;
import com.example.demo.dto.review.ReviewRequestDto;
import com.example.demo.entity.Feedback;
import com.example.demo.entity.Score;
import com.example.demo.entity.Submission;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.FeedbackRepository;
import com.example.demo.repository.ScoreRepository;
import com.example.demo.repository.SubmissionRepository;
import com.example.demo.repository.UserRepository;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SubmissionReviewService {

  private static final DateTimeFormatter DT_FMT =
      DateTimeFormatter.ofPattern("MMM d, yyyy HH:mm");

  private final SubmissionRepository submissionRepository;
  private final ScoreRepository scoreRepository;
  private final FeedbackRepository feedbackRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public List<FlaggedSubmissionDto> getFlagged(String callerEmail, UUID requestedCompanyId) {
    User caller =
        userRepository
            .findByEmail(callerEmail)
            .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));

    // ADMIN may optionally filter by companyId; MANAGER is always scoped to their own company
    UUID companyId =
        caller.getRole() == com.example.demo.entity.User.Role.ADMIN
            ? requestedCompanyId
            : caller.getCompany().getId();

    return submissionRepository.findFlaggedByCompany(companyId).stream()
        .map(this::toDto)
        .toList();
  }

  @Transactional
  public void review(UUID submissionId, ReviewRequestDto dto, String managerEmail) {
    Submission submission =
        submissionRepository
            .findById(submissionId)
            .orElseThrow(() -> new ServerException(ErrorCode.SUBMISSION_NOT_FOUND));

    User manager =
        userRepository
            .findByEmail(managerEmail)
            .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));

    Score score =
        scoreRepository
            .findBySubmissionId(submissionId)
            .orElseThrow(() -> new ServerException(ErrorCode.SUBMISSION_NOT_FOUND));

    if (dto.getAction() == ReviewRequestDto.Action.DISPUTE) {
      Feedback feedback =
          Feedback.builder()
              .score(score)
              .manager(manager)
              .correctedScore(dto.getCorrectedScore())
              .notes(dto.getNotes())
              .usedForTraining(true)
              .build();
      feedbackRepository.save(feedback);
    }

    submission.setFlaggedForReview(false);
    submission.setStatus(Submission.Status.REVIEWED);
    submissionRepository.save(submission);
  }

  private FlaggedSubmissionDto toDto(Submission s) {
    Score score = s.getScore();
    return FlaggedSubmissionDto.builder()
        .submissionId(s.getId())
        .repName(s.getRep().getName())
        .repEmail(s.getRep().getEmail())
        .storeName(s.getStore().getName())
        .storeAddress(s.getStore().getAddress())
        .assignmentDate(
            s.getAssignment() != null && s.getAssignment().getAssignmentDate() != null
                ? s.getAssignment().getAssignmentDate().toString()
                : null)
        .submittedAt(s.getSubmittedAt() != null ? s.getSubmittedAt().format(DT_FMT) : null)
        .photoUrl(s.getPhotoUrl())
        .planogramName(s.getPlanogram() != null ? s.getPlanogram().getName() : null)
        .overallScore(score != null && score.getOverallScore() != null ? score.getOverallScore() : 0f)
        .scoreDetail(score != null ? score.getDetailFlags() : null)
        .build();
  }
}
