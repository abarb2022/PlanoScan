package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "submissions",
    indexes = {
      @Index(name = "idx_submissions_assignment_status", columnList = "assignment_id, status")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "rep_id", nullable = false)
  private User rep;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "store_id", nullable = false)
  private Store store;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "planogram_id")
  private Planogram planogram;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assignment_id")
  private StoreAssignment assignment;

  @Column(name = "photo_url", nullable = false)
  private String photoUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private Status status = Status.PENDING;

  @Column(name = "flagged_for_review", nullable = false)
  @Builder.Default
  private boolean flaggedForReview = false;

  @Column(name = "scoring_attempts", nullable = false)
  @Builder.Default
  private int scoringAttempts = 0;

  @CreationTimestamp
  @Column(name = "submitted_at", updatable = false)
  private LocalDateTime submittedAt;

  @OneToOne(mappedBy = "submission", fetch = FetchType.LAZY)
  private Score score;

  public enum Status {
    PENDING,
    PROCESSING,
    SCORED,
    REVIEWED
  }
}
