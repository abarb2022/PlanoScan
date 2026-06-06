package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false, unique = true)
    private Submission submission;

    @Column(name = "overall_score", nullable = false)
    private Float overallScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detail_flags", columnDefinition = "jsonb")
    private Map<String, Object> detailFlags;

    @Column(name = "ai_model_version")
    private String aiModelVersion;

    @CreationTimestamp
    @Column(name = "scored_at", updatable = false)
    private LocalDateTime scoredAt;

    @OneToMany(mappedBy = "score", fetch = FetchType.LAZY)
    private List<Feedback> feedbacks;
}
