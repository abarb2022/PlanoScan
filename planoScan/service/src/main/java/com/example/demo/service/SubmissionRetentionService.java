package com.example.demo.service;

import com.example.demo.entity.Score;
import com.example.demo.entity.Submission;
import com.example.demo.repository.FeedbackRepository;
import com.example.demo.repository.ScoreRepository;
import com.example.demo.repository.SubmissionRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionRetentionService {

  private final SubmissionRepository submissionRepository;
  private final ScoreRepository scoreRepository;
  private final FeedbackRepository feedbackRepository;
  private final PhotoStorage photoStorage;

  @Value("${submission.retention-months:3}")
  private int retentionMonths;

  @Transactional
  public int purgeExpiredSubmissions() {
    LocalDateTime cutoff = LocalDateTime.now().minusMonths(retentionMonths);
    List<Submission> expired = submissionRepository.findForRetentionCleanup(cutoff);

    if (expired.isEmpty()) {
      log.debug("Submission retention cleanup: nothing submitted before {}", cutoff);
      return 0;
    }

    log.info(
        "Submission retention cleanup: purging {} submission(s) submitted before {}",
        expired.size(),
        cutoff);

    int purged = 0;
    for (Submission submission : expired) {
      try {
        purgeOne(submission);
        purged++;
      } catch (Exception e) {
        log.error("Failed to purge submission {}: {}", submission.getId(), e.getMessage(), e);
      }
    }

    log.info("Submission retention cleanup: purged {}/{} submission(s)", purged, expired.size());
    return purged;
  }

  private void purgeOne(Submission submission) {
    Score score = submission.getScore();
    if (score != null) {
      if (!score.getFeedbacks().isEmpty()) {
        feedbackRepository.deleteAll(score.getFeedbacks());
      }
      scoreRepository.delete(score);
    }

    photoStorage.delete(submission.getPhotoUrl());
    submissionRepository.delete(submission);
  }
}
