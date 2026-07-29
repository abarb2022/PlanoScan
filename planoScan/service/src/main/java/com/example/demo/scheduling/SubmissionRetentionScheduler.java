package com.example.demo.scheduling;

import com.example.demo.service.SubmissionRetentionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SubmissionRetentionScheduler {

  private final SubmissionRetentionService retentionService;

  @Scheduled(cron = "${submission.retention-cron:0 0 3 * * *}")
  public void purgeExpiredSubmissions() {
    retentionService.purgeExpiredSubmissions();
  }
}
