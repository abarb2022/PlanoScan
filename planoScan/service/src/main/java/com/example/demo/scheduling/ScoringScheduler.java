package com.example.demo.scheduling;

import com.example.demo.entity.Submission;
import com.example.demo.repository.SubmissionRepository;
import com.example.demo.service.ScoringService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScoringScheduler {

  private final SubmissionRepository submissionRepository;
  private final ScoringService scoringService;

  @Value("${scoring.max-attempts:3}")
  private int maxAttempts;

  @Scheduled(fixedDelayString = "${scoring.poll-interval-ms:30000}")
  public void processPendingSubmissions() {
    List<Submission> pending = submissionRepository.findPendingForScoring(maxAttempts);

    if (pending.isEmpty()) return;

    log.info("Scoring {} pending submission(s)", pending.size());
    for (Submission submission : pending) {
      try {
        scoringService.scoreSubmission(submission);
      } catch (Exception e) {
        log.error("Unexpected error scoring submission {}", submission.getId(), e);
      }
    }
  }
}
