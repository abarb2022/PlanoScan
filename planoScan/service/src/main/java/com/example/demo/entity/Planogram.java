package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "planograms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Planogram {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_id", nullable = false)
  private Company company;

  @Column(nullable = false)
  private String name;

  @Column(name = "product_category")
  private String productCategory;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "layout_spec", columnDefinition = "jsonb")
  private Map<String, Object> layoutSpec;

  @Column(name = "reference_image_url")
  private String referenceImageUrl;

  @Column(name = "is_active", nullable = false)
  @Builder.Default
  private boolean isActive = true;

  @Column(name = "valid_from")
  private LocalDate validFrom;

  @Column(name = "valid_until")
  private LocalDate validUntil;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "planogram", fetch = FetchType.LAZY)
  private List<PlanogramAssignment> assignments;

  @OneToMany(mappedBy = "planogram", fetch = FetchType.LAZY)
  private List<Submission> submissions;
}
