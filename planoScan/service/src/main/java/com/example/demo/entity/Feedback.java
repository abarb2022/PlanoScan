package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "score_id", nullable = false)
  private Score score;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "manager_id", nullable = false)
  private User manager;

  @Column(name = "corrected_score")
  private Float correctedScore;

  @Column(columnDefinition = "text")
  private String notes;

  @Column(name = "used_for_training", nullable = false)
  @Builder.Default
  private boolean usedForTraining = false;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
